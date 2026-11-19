-- 20261119100000_feed_curtir_seguir.sql
--
-- Feed de projetos concluídos, com curtir e seguir (MVP da rede social de portfólios).
--
-- Regras (decididas com o dono em 19/11/2026):
--  * Só entra no feed trabalho aceito DEPOIS do aviso no "Aceitar trabalho" (feed_aceito_em preenchido).
--    Trabalhos aceitos antes do aviso nunca entram.
--  * O cliente pode retirar o trabalho do feed a qualquer momento (feed_revogado_em). Não volta sem novo aceite.
--  * O prestador pode ocultar cada trabalho (feed_oculto). Não apaga nada.
--  * Foto com pessoas só aparece se o prestador confirmou o consentimento de terceiros.
--  * Ordem: mais recentes primeiro, com rodízio entre prestadores. Nada é vendido nem sobe por selo.
--  * Visitante vê o feed sem login. Curtir e seguir exigem login. Quem é seguido vê só o total, nunca quem.
--  * O feed nunca devolve nome de cliente, WhatsApp nem endereço.

-- 1) Colunas do feed em portfolio_projetos (leitura só para quem está logado; o anônimo não enxerga).
alter table public.portfolio_projetos
  add column if not exists feed_aceito_em timestamptz,
  add column if not exists feed_aceito_versao text,
  add column if not exists feed_oculto boolean not null default false,
  add column if not exists feed_revogado_em timestamptz;

grant select (feed_aceito_em, feed_oculto, feed_revogado_em) on public.portfolio_projetos to authenticated;

-- 2) Aceite do trabalho passa a registrar o aviso do feed.
drop function if exists public.aceitar_projeto(uuid, text);

create or replace function public.aceitar_projeto(p_projeto_id uuid, p_nome text, p_feed_versao text default null)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid; v_status text;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  select cliente_user_id, status into v_dono, v_status from public.portfolio_projetos where id = p_projeto_id for update;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is distinct from v_uid then return 'nao_e_dono'; end if;
  if v_status <> 'pendente' then return 'status_invalido'; end if;
  update public.portfolio_projetos
     set status = 'em_execucao', aceito_at = now(),
         cliente_nome = coalesce(nullif(btrim(p_nome), ''), cliente_nome),
         feed_aceito_em = case when nullif(btrim(p_feed_versao), '') is not null then now() end,
         feed_aceito_versao = nullif(btrim(p_feed_versao), '')
   where id = p_projeto_id;
  return 'ok';
end; $function$;

revoke all on function public.aceitar_projeto(uuid, text, text) from public, anon;
grant execute on function public.aceitar_projeto(uuid, text, text) to authenticated, service_role;

-- 3) Prestador oculta/mostra um trabalho no feed.
create or replace function public.feed_ocultar_projeto(p_projeto_id uuid, p_ocultar boolean)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  select pr.user_id into v_dono
    from public.portfolio_projetos p join public.prestadores pr on pr.id = p.prestador_id
   where p.id = p_projeto_id;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is distinct from v_uid then return 'nao_e_dono'; end if;
  update public.portfolio_projetos set feed_oculto = coalesce(p_ocultar, false) where id = p_projeto_id;
  return 'ok';
end; $function$;

-- 4) Cliente retira o trabalho do feed. Não volta sem novo aceite (que não existe para o mesmo trabalho).
create or replace function public.revogar_feed_projeto(p_projeto_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid; v_aceito timestamptz;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  select cliente_user_id, feed_aceito_em into v_dono, v_aceito from public.portfolio_projetos where id = p_projeto_id;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is distinct from v_uid then return 'nao_e_dono'; end if;
  if v_aceito is null then return 'nunca_esteve_no_feed'; end if;
  update public.portfolio_projetos set feed_revogado_em = coalesce(feed_revogado_em, now()) where id = p_projeto_id;
  return 'ok';
end; $function$;

-- 5) Seguir prestadores. Quem segue só aparece para si mesmo; o seguido vê apenas o total.
create table if not exists public.seguidores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prestador_id bigint not null references public.prestadores(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint seguidores_unico unique (user_id, prestador_id)
);
create index if not exists seguidores_prestador_idx on public.seguidores (prestador_id);

alter table public.seguidores enable row level security;
drop policy if exists seguidores_ver_os_proprios on public.seguidores;
create policy seguidores_ver_os_proprios on public.seguidores for select to authenticated using (user_id = auth.uid());
revoke all on public.seguidores from anon, authenticated;
grant select on public.seguidores to authenticated;

create or replace function public.seguir_prestador(p_prestador_id bigint)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid; v_total int;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  select user_id into v_dono from public.prestadores
   where id = p_prestador_id and status = 'ativo' and bloqueado is not true and exemplo is not true;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is not distinct from v_uid then return 'proprio_perfil'; end if;
  select count(*) into v_total from public.seguidores where user_id = v_uid;
  if v_total >= 500 and not exists (select 1 from public.seguidores where user_id = v_uid and prestador_id = p_prestador_id) then
    return 'limite_atingido';
  end if;
  insert into public.seguidores (user_id, prestador_id) values (v_uid, p_prestador_id) on conflict do nothing;
  return 'ok';
end; $function$;

create or replace function public.deixar_de_seguir(p_prestador_id bigint)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  delete from public.seguidores where user_id = v_uid and prestador_id = p_prestador_id;
  return 'ok';
end; $function$;

-- Total público de seguidores (só o número).
create or replace function public.total_seguidores(p_prestador_id bigint)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  select count(*)::int from public.seguidores where prestador_id = p_prestador_id;
$function$;

-- 6) Curtir / descurtir um trabalho que aparece publicamente.
create or replace function public.alternar_curtida(p_projeto_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_status text; v_dono uuid; v_curtiu boolean; v_total int;
begin
  if v_uid is null then return jsonb_build_object('erro', 'nao_autenticado'); end if;
  select p.status, pr.user_id into v_status, v_dono
    from public.portfolio_projetos p join public.prestadores pr on pr.id = p.prestador_id
   where p.id = p_projeto_id;
  if not found or v_status not in ('em_execucao', 'finalizado') then return jsonb_build_object('erro', 'nao_encontrado'); end if;
  if v_dono is not distinct from v_uid then return jsonb_build_object('erro', 'proprio_projeto'); end if;

  if exists (select 1 from public.portfolio_curtidas where projeto_id = p_projeto_id and user_id = v_uid) then
    delete from public.portfolio_curtidas where projeto_id = p_projeto_id and user_id = v_uid;
    v_curtiu := false;
  else
    insert into public.portfolio_curtidas (projeto_id, user_id) values (p_projeto_id, v_uid) on conflict do nothing;
    v_curtiu := true;
  end if;
  select count(*)::int into v_total from public.portfolio_curtidas where projeto_id = p_projeto_id;
  return jsonb_build_object('curtido', v_curtiu, 'total', v_total);
end; $function$;

-- 7) O feed. Devolve só o que pode ser público; nunca nome de cliente, WhatsApp ou endereço.
create or replace function public.feed_projetos(
  p_categoria_id uuid default null,
  p_cidade_id uuid default null,
  p_somente_seguidos boolean default false,
  p_limite integer default 12,
  p_pagina integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_limite int := least(greatest(coalesce(p_limite, 12), 1), 30); v_pag int := greatest(coalesce(p_pagina, 0), 0); r jsonb;
begin
  if p_somente_seguidos and v_uid is null then return '[]'::jsonb; end if;

  with elegiveis as (
    select p.id, p.prestador_id, p.titulo, p.descricao,
           coalesce(p.marcado_concluido_at, p.aceito_at, p.created_at) as quando
      from public.portfolio_projetos p
      join public.prestadores pr on pr.id = p.prestador_id
     where p.status = 'finalizado'
       and p.feed_aceito_em is not null
       and p.feed_revogado_em is null
       and p.feed_oculto = false
       and pr.status = 'ativo' and pr.bloqueado is not true and pr.exemplo is not true
       and (p_categoria_id is null or pr.categoria_id = p_categoria_id)
       and (p_cidade_id is null or pr.cidade_id = p_cidade_id)
       and (not p_somente_seguidos or exists (select 1 from public.seguidores s where s.user_id = v_uid and s.prestador_id = p.prestador_id))
       and exists (select 1 from public.portfolio_fotos f where f.projeto_id = p.id and (f.contem_pessoas is not true or f.consentimento_terceiros_confirmado is true))
  ),
  rodizio as (
    select e.*, row_number() over (partition by e.prestador_id order by e.quando desc, e.id) as rodada from elegiveis e
  ),
  pagina as (
    select * from rodizio order by rodada, quando desc, id offset v_pag * v_limite limit v_limite
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'projeto_id', g.id,
      'titulo', g.titulo,
      'descricao', left(coalesce(g.descricao, ''), 280),
      'concluido_em', g.quando,
      'prestador', jsonb_build_object('id', pr.id, 'nome', pr.nome, 'slug', pr.slug, 'categoria', c.nome, 'cidade', ci.nome),
      'fotos', (select coalesce(jsonb_agg(x.url_foto), '[]'::jsonb) from (
                  select f.url_foto from public.portfolio_fotos f
                   where f.projeto_id = g.id and (f.contem_pessoas is not true or f.consentimento_terceiros_confirmado is true)
                   order by f.capa desc nulls last, f.ordem nulls last limit 5) x),
      'total_curtidas', (select count(*)::int from public.portfolio_curtidas k where k.projeto_id = g.id),
      'curtido_por_mim', v_uid is not null and exists (select 1 from public.portfolio_curtidas k where k.projeto_id = g.id and k.user_id = v_uid),
      'seguindo', v_uid is not null and exists (select 1 from public.seguidores s where s.user_id = v_uid and s.prestador_id = g.prestador_id)
    ) order by g.rodada, g.quando desc, g.id), '[]'::jsonb)
    into r
    from pagina g
    join public.prestadores pr on pr.id = g.prestador_id
    left join public.categorias c on c.id = pr.categoria_id
    left join public.cidades ci on ci.id = pr.cidade_id;

  return r;
end; $function$;

-- Permissões: o feed é público; o resto exige login.
revoke all on function public.feed_ocultar_projeto(uuid, boolean) from public, anon;
revoke all on function public.revogar_feed_projeto(uuid) from public, anon;
revoke all on function public.seguir_prestador(bigint) from public, anon;
revoke all on function public.deixar_de_seguir(bigint) from public, anon;
revoke all on function public.alternar_curtida(uuid) from public, anon;
revoke all on function public.total_seguidores(bigint) from public;
revoke all on function public.feed_projetos(uuid, uuid, boolean, integer, integer) from public;

grant execute on function public.feed_ocultar_projeto(uuid, boolean) to authenticated, service_role;
grant execute on function public.revogar_feed_projeto(uuid) to authenticated, service_role;
grant execute on function public.seguir_prestador(bigint) to authenticated, service_role;
grant execute on function public.deixar_de_seguir(bigint) to authenticated, service_role;
grant execute on function public.alternar_curtida(uuid) to authenticated, service_role;
grant execute on function public.total_seguidores(bigint) to anon, authenticated, service_role;
grant execute on function public.feed_projetos(uuid, uuid, boolean, integer, integer) to anon, authenticated, service_role;
