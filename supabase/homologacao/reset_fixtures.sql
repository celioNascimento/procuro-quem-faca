-- ============================================================================
-- EXCLUSIVO DO BANCO DE HOMOLOGAÇÃO (projeto "procuro-quem-faca-teste").
-- NUNCA aplicar em produção. Este arquivo fica FORA de supabase/migrations de propósito.
--
-- Cria o reset das fixtures usado pelos testes E2E que gravam dados:
--   1) e2e_capturar_baseline(): fotografa o estado limpo (a semente) no schema privado e2e_baseline.
--   2) e2e_resetar_fixtures():  devolve o banco a esse estado (apaga o que os testes criaram,
--                                restaura o que alteraram).
--
-- Guarda: as duas funções se recusam a rodar se a tabela public.ambiente_teste_marcador
-- não tiver a linha 'homologacao'. Essa tabela só existe no banco de teste.
--
-- Como usar:
--   a) aplique este arquivo no banco de teste;
--   b) com o banco na semente limpa, rode:  select public.e2e_capturar_baseline();
--   c) os testes chamam e2e_resetar_fixtures() via RPC antes de cada teste que grava.
-- Sempre que a semente mudar (novas contas ou dados fictícios), rode (b) de novo.
--
-- Limite conhecido: o Supabase proíbe DELETE direto em storage.objects. Arquivos enviados
-- por testes de upload devem ser removidos pela API do Storage.
-- ============================================================================

create table if not exists public.ambiente_teste_marcador (nome text primary key);
insert into public.ambiente_teste_marcador (nome) values ('homologacao') on conflict do nothing;
alter table public.ambiente_teste_marcador enable row level security;
revoke all on public.ambiente_teste_marcador from public, anon, authenticated;

-- Tabelas de referência/configuração que os testes não alteram: ficam fora do reset.
create or replace function public.e2e_tabelas_referencia() returns text[]
language sql immutable as $$
  select array['ambiente_teste_marcador','categorias','categorias_grupos','cidades','estados','habilidades',
               'regioes','retencao_regras','rastreio_config','perfis_admin','logs_atividades','catalogo_itens',
               'consentimentos']  -- aceite dos termos das contas fixas sobrevive ao reset (ver e2e_resetar_fixtures)
$$;
revoke all on function public.e2e_tabelas_referencia() from public, anon, authenticated;

create or replace function public.e2e_capturar_baseline() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; colunas text;
begin
  if not exists (select 1 from public.ambiente_teste_marcador where nome = 'homologacao') then
    raise exception 'Este banco não é o de homologação: baseline recusado.';
  end if;
  drop schema if exists e2e_baseline cascade;
  create schema e2e_baseline;
  for r in select tablename from pg_tables
           where schemaname = 'public' and tablename <> all (public.e2e_tabelas_referencia()) loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into colunas
      from information_schema.columns
     where table_schema = 'public' and table_name = r.tablename and is_generated = 'NEVER';
    execute format('create table e2e_baseline.%I as select %s from public.%I', r.tablename, colunas, r.tablename);
  end loop;
  create table e2e_baseline.auth_users as select id from auth.users;
  create table e2e_baseline.storage_objects as select id from storage.objects;
end $$;
revoke all on function public.e2e_capturar_baseline() from public, anon, authenticated;

create or replace function public.e2e_resetar_fixtures() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; colunas text;
begin
  if not exists (select 1 from public.ambiente_teste_marcador where nome = 'homologacao') then
    raise exception 'Este banco não é o de homologação: reset recusado.';
  end if;
  if not exists (select 1 from information_schema.schemata where schema_name = 'e2e_baseline') then
    raise exception 'Sem baseline: rode e2e_capturar_baseline() antes.';
  end if;

  -- 0) Avaliações de contas criadas pelos testes (a FK com o Auth não tem cascata): sai antes das contas.
  delete from public.avaliacoes where cliente_id not in (select id from e2e_baseline.auth_users);

  -- 1) Contas criadas pelos testes (a cascata do Auth leva perfis ligados).
  delete from auth.users where id not in (select id from e2e_baseline.auth_users);

  -- 1b) Aceite dos termos: o das contas fixas (as da semente) é mantido, para quem testa à mão na homologação
  --     não ter que aceitar de novo a cada rodada do E2E. O das contas criadas pelos testes fica órfão
  --     (a FK zera o user_id ao apagar a conta) e sai aqui; essas contas novas ainda passam pela tela de aceite.
  delete from public.consentimentos where user_id is null;

  -- 2) Tabelas de fixture: apaga tudo e reinsere a semente, sem disparar gatilhos nem checagem de FK.
  set local session_replication_role = replica;
  for r in select tablename from pg_tables where schemaname = 'e2e_baseline'
            and tablename not in ('auth_users','storage_objects','consentimentos') loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into colunas
      from information_schema.columns
     where table_schema = 'public' and table_name = r.tablename and is_generated = 'NEVER';
    execute format('delete from public.%I where true', r.tablename);  -- o Supabase exige WHERE em DELETE
    execute format('insert into public.%I (%s) overriding system value select %s from e2e_baseline.%I',
                   r.tablename, colunas, colunas, r.tablename);
  end loop;
end $$;
revoke all on function public.e2e_resetar_fixtures() from public;
grant execute on function public.e2e_resetar_fixtures() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Conta de teste já confirmada. O projeto exige confirmação por e-mail (como a produção) e
-- um e-mail .invalid nunca a recebe; os testes que precisam de login com conta nova usam esta
-- função. Só aceita e-mails e2e-*@pqf-teste.invalid; o e2e_resetar_fixtures() apaga a conta.
-- Copia instance_id e metadados da conta cliente@pqf-teste.invalid da semente.
-- ----------------------------------------------------------------------------
create or replace function public.e2e_criar_conta(p_email text, p_senha text) returns uuid
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_id uuid := gen_random_uuid(); v_meta jsonb; v_inst uuid;
begin
  if not exists (select 1 from public.ambiente_teste_marcador where nome = 'homologacao') then
    raise exception 'Este banco não é o de homologação: criação de conta recusada.';
  end if;
  if p_email !~ '^e2e-[a-z0-9-]+@pqf-teste\.invalid$' then
    raise exception 'E-mail fora do padrão e2e-*@pqf-teste.invalid.';
  end if;
  select raw_user_meta_data, instance_id into v_meta, v_inst from auth.users where email = 'cliente@pqf-teste.invalid';
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
  values (v_inst, v_id, 'authenticated', 'authenticated', p_email, crypt(p_senha, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, coalesce(v_meta, '{}'::jsonb), now(), now(),
      '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), v_id, v_id::text, 'email',
      jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
      now(), now(), now());
  return v_id;
end $$;
revoke all on function public.e2e_criar_conta(text, text) from public;
grant execute on function public.e2e_criar_conta(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Apoio aos E2E dos selos calculados (Etapa 2, Parte B). Só no banco de TESTE (checam o marcador).
-- e2e_semear_experiencia: cria N serviços finalizados e avaliados (nota informada), cada um por um cliente
--   novo (conta fictícia e2e-exp-*). O e2e_resetar_fixtures() apaga tudo isso.
-- e2e_ajustar_cnpj: define data de abertura e CNAE do CNPJ fictício do prestador.
-- ----------------------------------------------------------------------------
create or replace function public.e2e_semear_experiencia(p_prestador_id bigint, p_servicos int, p_nota int default 5) returns void
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_u uuid; v_proj uuid; v_inst uuid; i int;
begin
  if not exists (select 1 from public.ambiente_teste_marcador where nome = 'homologacao') then
    raise exception 'Este banco não é o de homologação: semente recusada.';
  end if;
  select instance_id into v_inst from auth.users where email = 'cliente@pqf-teste.invalid';
  for i in 1..p_servicos loop
    v_u := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, created_at, updated_at)
      values (v_inst, v_u, 'authenticated', 'authenticated', 'e2e-exp-' || replace(v_u::text, '-', '') || '@pqf-teste.invalid', now(), now(), now());
    insert into public.portfolio_projetos (prestador_id, status, titulo) values (p_prestador_id, 'finalizado', 'Serviço de teste ' || i) returning id into v_proj;
    insert into public.avaliacoes (projeto_id, prestador_id, cliente_id, nota, status, visivel)
      values (v_proj, p_prestador_id, v_u, p_nota, 'finalizado', true);
  end loop;
end $$;
revoke all on function public.e2e_semear_experiencia(bigint, int, int) from public;
grant execute on function public.e2e_semear_experiencia(bigint, int, int) to anon, authenticated;

create or replace function public.e2e_ajustar_cnpj(p_prestador_id bigint, p_data_abertura date, p_cnae text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.ambiente_teste_marcador where nome = 'homologacao') then
    raise exception 'Este banco não é o de homologação: ajuste recusado.';
  end if;
  update public.prestador_cnpj set data_abertura = p_data_abertura, cnae_codigo = p_cnae where prestador_id = p_prestador_id;
end $$;
revoke all on function public.e2e_ajustar_cnpj(bigint, date, text) from public;
grant execute on function public.e2e_ajustar_cnpj(bigint, date, text) to anon, authenticated;
