-- JÁ APLICADO NO BANCO em 10/11/2026 (arquivo para versionar). Idempotente: pode rodar de novo.
--
-- Token secreto por perfil sem conta: prova de titularidade para assumir ou excluir o perfil.
-- Fica em tabela separada, sem policy: nenhuma leitura direta por anon/authenticated.
-- Só as funções SECURITY DEFINER abaixo enxergam a tabela. O token é criado sob demanda pelo admin.

create table if not exists public.prestador_tokens (
  prestador_id bigint primary key references public.prestadores(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  criado_em timestamptz not null default now()
);
alter table public.prestador_tokens enable row level security;
revoke all on table public.prestador_tokens from anon, authenticated;

-- Lógica única de apagar prestador sem conta (interna: não exposta na API)
create or replace function public.apagar_prestador_sem_conta(p_prestador_id bigint)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_aval integer := 0;
  v_den integer := 0;
begin
  -- Mantém só o dado anônimo das avaliações já feitas
  update public.avaliacoes
     set prestador_id = null, projeto_id = null, cliente_id = null,
         cliente_nome = 'Cliente anonimizado', cliente_foto_url = null,
         comentario = null, resposta_prestador = null
   where prestador_id = p_prestador_id;
  get diagnostics v_aval = row_count;

  update public.denuncias set prestador_id = null where prestador_id = p_prestador_id;
  get diagnostics v_den = row_count;

  -- Cascata: cliques, visitas_perfil, portfólio, orçamentos, catálogo, garantias, token
  delete from public.prestadores where id = p_prestador_id;

  return jsonb_build_object('avaliacoes_anonimizadas', v_aval, 'denuncias_desvinculadas', v_den);
end;
$function$;
revoke all on function public.apagar_prestador_sem_conta(bigint) from public, anon, authenticated;

-- Versão do admin (substitui a do arquivo 20261109210100) usando a lógica única
create or replace function public.excluir_prestador_titular(p_prestador_id bigint, p_solicitacao_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_resultado jsonb;
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores podem excluir prestadores' using errcode = '42501';
  end if;

  select user_id into v_user_id from public.prestadores where id = p_prestador_id;
  if not found then
    raise exception 'Prestador não encontrado' using errcode = 'P0002';
  end if;
  if v_user_id is not null then
    raise exception 'Prestador com conta: use a exclusão de conta' using errcode = '22023';
  end if;

  v_resultado := public.apagar_prestador_sem_conta(p_prestador_id);

  if p_solicitacao_id is not null then
    update public.solicitacoes_titular
       set status = 'atendida', respondido_em = now(),
           atendido_por = (select auth.uid()), updated_at = now()
     where id = p_solicitacao_id;
  end if;

  insert into public.logs_atividades (acao, usuario_id, entidade_tipo, entidade_id, detalhes)
  values ('EXCLUSAO_PRESTADOR_TITULAR', (select auth.uid()), 'prestador', p_prestador_id::text,
          v_resultado || jsonb_build_object('solicitacao_id', p_solicitacao_id));

  return v_resultado;
end;
$function$;

-- Admin gera (ou reaproveita) o token do perfil para montar o link enviado ao titular
create or replace function public.admin_token_reivindicacao(p_prestador_id bigint)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_token uuid;
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;

  select user_id into v_user_id from public.prestadores where id = p_prestador_id;
  if not found then
    raise exception 'Prestador não encontrado' using errcode = 'P0002';
  end if;
  if v_user_id is not null then
    raise exception 'Perfil já tem conta' using errcode = '22023';
  end if;

  insert into public.prestador_tokens (prestador_id) values (p_prestador_id)
  on conflict (prestador_id) do nothing;

  select token into v_token from public.prestador_tokens where prestador_id = p_prestador_id;
  return v_token;
end;
$function$;
revoke all on function public.admin_token_reivindicacao(bigint) from public, anon;
grant execute on function public.admin_token_reivindicacao(bigint) to authenticated, service_role;

-- Página do link: mostra só o nome do perfil, nunca outros dados
create or replace function public.consultar_perfil_por_token(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object('id', p.id, 'nome', p.nome)
    from public.prestador_tokens t
    join public.prestadores p on p.id = t.prestador_id
   where t.token = p_token and p.user_id is null;
$function$;
revoke all on function public.consultar_perfil_por_token(uuid) from public;
grant execute on function public.consultar_perfil_por_token(uuid) to anon, authenticated, service_role;

-- Titular exclui o próprio perfil com o link (sem login)
create or replace function public.excluir_perfil_por_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_id bigint;
  v_user_id uuid;
  v_resultado jsonb;
begin
  select t.prestador_id, p.user_id into v_id, v_user_id
    from public.prestador_tokens t
    join public.prestadores p on p.id = t.prestador_id
   where t.token = p_token;

  if not found then
    raise exception 'Link inválido ou já utilizado' using errcode = 'P0002';
  end if;
  if v_user_id is not null then
    raise exception 'Perfil já tem conta: use a exclusão de conta' using errcode = '22023';
  end if;

  v_resultado := public.apagar_prestador_sem_conta(v_id);

  insert into public.logs_atividades (acao, entidade_tipo, entidade_id, detalhes)
  values ('EXCLUSAO_PRESTADOR_TOKEN', 'prestador', v_id::text, v_resultado);

  return v_resultado;
end;
$function$;
revoke all on function public.excluir_perfil_por_token(uuid) from public;
grant execute on function public.excluir_perfil_por_token(uuid) to anon, authenticated, service_role;

-- Titular assume o perfil com o link (exige login). O app grava o restante do cadastro depois.
-- Cada usuário só pode ter um perfil (prestadores_user_id_unique): erro claro, sem consumir o token.
create or replace function public.reivindicar_perfil_por_token(p_token uuid)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_id bigint;
  v_user_id uuid;
begin
  if v_uid is null then
    raise exception 'Faça login para assumir o perfil' using errcode = '28000';
  end if;

  select t.prestador_id, p.user_id into v_id, v_user_id
    from public.prestador_tokens t
    join public.prestadores p on p.id = t.prestador_id
   where t.token = p_token;

  if not found then
    raise exception 'Link inválido ou já utilizado' using errcode = 'P0002';
  end if;
  if v_user_id is not null then
    raise exception 'Perfil já foi assumido' using errcode = '22023';
  end if;

  if exists (select 1 from public.prestadores where user_id = v_uid) then
    raise exception 'Esta conta já possui outro perfil' using errcode = '23505';
  end if;

  update public.prestadores set user_id = v_uid where id = v_id and user_id is null;
  delete from public.prestador_tokens where prestador_id = v_id;

  insert into public.logs_atividades (acao, usuario_id, entidade_tipo, entidade_id)
  values ('REIVINDICACAO_PERFIL', v_uid, 'prestador', v_id::text);

  return v_id;
end;
$function$;
revoke all on function public.reivindicar_perfil_por_token(uuid) from public, anon;
grant execute on function public.reivindicar_perfil_por_token(uuid) to authenticated, service_role;
