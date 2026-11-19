-- Agendador da reverificação de CNPJ (Supabase pg_cron + pg_net). NÃO é migration: leva a URL e o
-- segredo do ambiente. Rodar UMA vez em cada ambiente (teste e produção), no SQL Editor do Supabase,
-- trocando os dois valores marcados. NUNCA commitar com o segredo preenchido.
--
-- Como funciona:
--  - A cada minuto o banco olha se existe selo para reconsultar (consulta local, não custa chamada externa).
--  - Só se existir, chama a rota /api/cron/cnpj-reverificacao (3 consultas por chamada, ritmo das fontes).
--  - Se as fontes responderem "limite", a rota para; o minuto seguinte tenta de novo.
--  - Uma vez por dia, o banco expira selos vencidos e limpa o cache (não precisa chamar o app).

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 1) Guarda URL e segredo no cofre (Vault). Troque os dois valores abaixo.
select vault.create_secret('https://SEU-DOMINIO/api/cron/cnpj-reverificacao', 'pqf_cron_url_cnpj');   -- TROCAR
select vault.create_secret('COLE_AQUI_O_CRON_SECRET_DA_VERCEL', 'pqf_cron_secret');                    -- TROCAR

-- 2) A cada minuto: chama a rota só quando há trabalho.
select cron.schedule(
  'pqf-cnpj-reverificacao-minuto',
  '* * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'pqf_cron_url_cnpj'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'pqf_cron_secret')
    ),
    timeout_milliseconds := 55000
  )
  where exists (select 1 from public.cnpj_reverificacao_pendentes(1));
  $$
);

-- 3) Uma vez por dia (03:00 UTC): expira selos vencidos e limpa o cache, direto no banco.
select cron.schedule(
  'pqf-cnpj-limpeza-diaria',
  '0 3 * * *',
  $$ select public.cnpj_expirar_vencidos(); select public.cnpj_limpar_cache(); $$
);

-- Para conferir:   select jobid, jobname, schedule, active from cron.job where jobname like 'pqf-%';
-- Histórico:       select * from cron.job_run_details order by start_time desc limit 10;
-- Para desligar:   select cron.unschedule('pqf-cnpj-reverificacao-minuto');
