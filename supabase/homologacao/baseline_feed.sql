-- supabase/homologacao/baseline_feed.sql
-- SÓ PARA O BANCO DE TESTE. Depois da migração 20261119100000_feed_curtir_seguir.sql, a base do reset de E2E
-- (schema e2e_baseline) precisa conhecer as colunas e a tabela novas, senão e2e_resetar_fixtures() quebra.
-- Não recapture a base inteira: isso gravaria dados de teste manual (ex.: semente do Jorge) como se fossem a semente.
alter table e2e_baseline.portfolio_projetos
  add column if not exists feed_aceito_em timestamptz,
  add column if not exists feed_aceito_versao text,
  add column if not exists feed_oculto boolean not null default false,
  add column if not exists feed_revogado_em timestamptz;
create table if not exists e2e_baseline.seguidores as select * from public.seguidores where false;

-- Depois da migração 20261119170000_feed_salvar.sql (tabela portfolio_salvos), a base do reset precisa conhecê-la.
create table if not exists e2e_baseline.portfolio_salvos as select * from public.portfolio_salvos where false;

-- Depois da migração 20261119180000_prestador_instagram.sql (coluna prestadores.instagram), a base do reset precisa conhecê-la.
alter table e2e_baseline.prestadores add column if not exists instagram text;
