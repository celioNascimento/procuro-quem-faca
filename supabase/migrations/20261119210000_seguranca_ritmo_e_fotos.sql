-- 20261119210000_seguranca_ritmo_e_fotos.sql
-- Segunda leva da varredura de segurança de 19/11 (doc 25):
--  1) portfolio_fotos.url_foto só aceita URL pública do bucket "portfolios" do Supabase (antes: qualquer URL, o que
--     deixaria um prestador pôr um rastreador de IP em quem vê o feed). A migração falha inteira (sem alterar nada) se
--     houver foto fora disso: corrija a linha e rode de novo.
--  2) Limite de ritmo por pessoa (anti-spam / anti-robô) em curtir, salvar, seguir e ocultar do feed. Estourou: devolve
--     'muito_rapido' (o app mostra "Calma! ..."). Limites: curtir/salvar 60 por minuto, seguir 30 por minuto, ocultar 30 por minuto.
--  3) Denúncia pública (visitante): no máximo 10 denúncias abertas por perfil por hora e 60 no total por minuto.
-- Mesmas assinaturas das migrações anteriores: create or replace (sem drop). Ordem de produção: depois de 20261119200000.

-- 1) Foto só do Storage do projeto
alter table public.portfolio_fotos drop constraint if exists portfolio_fotos_url_storage;
alter table public.portfolio_fotos add constraint portfolio_fotos_url_storage
  check (url_foto ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/portfolios/');

-- 2) Contador de ações recentes (só o banco mexe; ninguém lê pela API)
create table if not exists public.acoes_ritmo (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  acao text not null,
  criado_em timestamptz not null default now()
);
create index if not exists acoes_ritmo_user_acao_idx on public.acoes_ritmo (user_id, acao, criado_em desc);
alter table public.acoes_ritmo enable row level security;
revoke all on public.acoes_ritmo from anon, authenticated;

create or replace function public.checar_ritmo(p_acao text, p_limite int, p_janela interval)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_n int;
begin
  if v_uid is null then return true; end if;
  select count(*) into v_n from public.acoes_ritmo where user_id = v_uid and acao = p_acao and criado_em > now() - p_janela;
  if v_n >= p_limite then return false; end if;
  insert into public.acoes_ritmo (user_id, acao) values (v_uid, p_acao);
  delete from public.acoes_ritmo where user_id = v_uid and criado_em < now() - interval '1 hour';
  return true;
end; $function$;
revoke all on function public.checar_ritmo(text, int, interval) from public, anon, authenticated;

create or replace function public.seguir_prestador(p_prestador_id bigint)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  if not public.checar_ritmo('seguir', 30, interval '1 minute') then return 'muito_rapido'; end if;
  select user_id into v_dono from public.prestadores
   where id = p_prestador_id and status = 'ativo' and bloqueado is not true and exemplo is not true;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is not distinct from v_uid then return 'proprio_perfil'; end if;
  insert into public.seguidores (user_id, prestador_id) values (v_uid, p_prestador_id) on conflict do nothing;
  return 'ok';
end; $function$;

create or replace function public.alternar_curtida(p_projeto_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_status text; v_dono uuid; v_curtiu boolean; v_total int;
begin
  if v_uid is null then return jsonb_build_object('erro', 'nao_autenticado'); end if;
  if not public.checar_ritmo('curtir', 60, interval '1 minute') then return jsonb_build_object('erro', 'muito_rapido'); end if;
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

create or replace function public.alternar_salvo(p_projeto_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_status text; v_dono uuid; v_total int;
begin
  if v_uid is null then return jsonb_build_object('erro', 'nao_autenticado'); end if;
  if not public.checar_ritmo('salvar', 60, interval '1 minute') then return jsonb_build_object('erro', 'muito_rapido'); end if;
  select p.status, pr.user_id into v_status, v_dono
    from public.portfolio_projetos p join public.prestadores pr on pr.id = p.prestador_id
   where p.id = p_projeto_id;
  if not found or v_status not in ('em_execucao', 'finalizado') then return jsonb_build_object('erro', 'nao_encontrado'); end if;
  if v_dono is not distinct from v_uid then return jsonb_build_object('erro', 'proprio_projeto'); end if;

  if exists (select 1 from public.portfolio_salvos where projeto_id = p_projeto_id and user_id = v_uid) then
    delete from public.portfolio_salvos where projeto_id = p_projeto_id and user_id = v_uid;
    return jsonb_build_object('salvo', false);
  end if;

  select count(*) into v_total from public.portfolio_salvos where user_id = v_uid;
  if v_total >= 500 then return jsonb_build_object('erro', 'limite_salvos'); end if;
  insert into public.portfolio_salvos (projeto_id, user_id) values (p_projeto_id, v_uid) on conflict do nothing;
  return jsonb_build_object('salvo', true);
end; $function$;

create or replace function public.feed_ocultar_projeto(p_projeto_id uuid, p_ocultar boolean)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  if not public.checar_ritmo('ocultar', 30, interval '1 minute') then return 'muito_rapido'; end if;
  select pr.user_id into v_dono
    from public.portfolio_projetos p join public.prestadores pr on pr.id = p.prestador_id
   where p.id = p_projeto_id;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is distinct from v_uid then return 'nao_e_dono'; end if;
  update public.portfolio_projetos set feed_oculto = coalesce(p_ocultar, false) where id = p_projeto_id;
  return 'ok';
end; $function$;

-- 3) Denúncia pública com teto de volume (a função é chamada pela política; precisa ser executável por visitante)
create or replace function public.denuncia_dentro_do_limite(p_prestador_id bigint)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select (select count(*) from public.denuncias where prestador_id = p_prestador_id and status = 'aberta' and created_at > now() - interval '1 hour') < 10
     and (select count(*) from public.denuncias where created_at > now() - interval '1 minute') < 60;
$function$;
revoke all on function public.denuncia_dentro_do_limite(bigint) from public;
grant execute on function public.denuncia_dentro_do_limite(bigint) to anon, authenticated;

drop policy if exists denuncias_insert_publico on public.denuncias;
create policy denuncias_insert_publico on public.denuncias for insert to anon, authenticated
  with check (
    prestador_id is not null and motivo is not null and length(btrim(motivo)) > 0 and status = 'aberta'
    and public.denuncia_dentro_do_limite(prestador_id)
  );
