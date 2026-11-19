-- supabase/homologacao/semente_feed.sql
-- SÓ PARA O BANCO DE TESTE. Nunca aplicar em produção.
--
-- Semente do feed para os E2E: o trabalho "Reforma de varanda (finalizado)" (prestador 2, cliente@pqf-teste.invalid,
-- 3 fotos, sem pessoas) passa a ter o aceite do feed, então já nasce visível em /feed em todo teste.
-- Os outros trabalhos de semente continuam FORA do feed (em execução, ou sem aceite).
--
-- ORDEM (importante): 1) select public.e2e_resetar_fixtures();  2) este arquivo;  3) select public.e2e_capturar_baseline();
-- Resetar antes evita gravar dados de teste manual como se fossem a semente.
update public.portfolio_projetos
   set feed_aceito_em = now(), feed_aceito_versao = '2026-11-feed-1', feed_oculto = false, feed_revogado_em = null
 where id = '22222222-2222-4222-8222-222222222222' and status = 'finalizado';
