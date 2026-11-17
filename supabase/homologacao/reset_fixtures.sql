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
               'regioes','retencao_regras','rastreio_config','perfis_admin','logs_atividades','catalogo_itens']
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

  -- 1) Contas criadas pelos testes (a cascata do Auth leva perfis ligados).
  delete from auth.users where id not in (select id from e2e_baseline.auth_users);

  -- 2) Tabelas de fixture: apaga tudo e reinsere a semente, sem disparar gatilhos nem checagem de FK.
  set local session_replication_role = replica;
  for r in select tablename from pg_tables where schemaname = 'e2e_baseline'
            and tablename not in ('auth_users','storage_objects') loop
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
