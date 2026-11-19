-- Etapa 2 do plano de confiança (doc 19): cache das consultas de CNPJ, compartilhado entre instâncias.
--
-- Guarda o resultado normalizado da consulta (inclui nomes do QSA, usados para conferir o nome do
-- prestador) por 24 horas. Acesso só pelo servidor (chave de serviço): nenhum papel do cliente lê ou escreve.
-- A limpeza das linhas vencidas entra na verificação mensal (job pg_cron, ainda não criado).

create table if not exists public.cnpj_consultas_cache (
  cnpj           text primary key check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'),
  dados          jsonb not null,
  consultado_em  timestamptz not null default now(),
  expira_em      timestamptz not null
);

create index if not exists cnpj_consultas_cache_expira_idx on public.cnpj_consultas_cache (expira_em);

alter table public.cnpj_consultas_cache enable row level security;
revoke all on public.cnpj_consultas_cache from public, anon, authenticated;
