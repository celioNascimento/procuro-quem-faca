-- Fecha as escritas abertas ligadas à avaliação. APLICAR SOMENTE DEPOIS de:
--   1) a migration 20261104190000_avaliar_projeto_somente_dono.sql estar aplicada; e
--   2) o app com `avaliarProjeto` (RPC) estar em produção.
-- Se aplicada antes do deploy, o fluxo atual de avaliar (/avaliar/[token]) deixa de gravar.
--
-- O que remove (nomes conferidos no banco em 04/11/2026):
--   avaliacoes          "Clientes logados podem avaliar"  INSERT  check auth.role() = 'authenticated'
--                       -> qualquer conta logada avaliava qualquer projeto/prestador.
--   avaliacoes          "Clientes podem avaliar"          INSERT  check auth.uid() = cliente_id
--                       -> deixava avaliar qualquer prestador sem ser dono do projeto.
--   portfolio_projetos  "Clientes podem finalizar projetos via token"  UPDATE (anon, authenticated)
--                       using avaliacao_token is not null / check status = 'finalizado'
--                       -> qualquer visitante podia alterar (e finalizar) qualquer projeto.
--
-- Depois disto a avaliação só entra por public.avaliar_projeto (SECURITY DEFINER, só o dono).
-- A leitura pública de avaliações visíveis e as policies dos prestadores NÃO são alteradas.
--
-- Rollback (se algo inesperado aparecer), recria exatamente as policies removidas:
--   create policy "Clientes logados podem avaliar" on public.avaliacoes
--     for insert to public with check (auth.role() = 'authenticated');
--   create policy "Clientes podem avaliar" on public.avaliacoes
--     for insert to authenticated with check (auth.uid() = cliente_id);
--   create policy "Clientes podem finalizar projetos via token" on public.portfolio_projetos
--     for update to anon, authenticated using (avaliacao_token is not null)
--     with check (status = 'finalizado');

drop policy if exists "Clientes logados podem avaliar" on public.avaliacoes;
drop policy if exists "Clientes podem avaliar" on public.avaliacoes;
drop policy if exists "Clientes podem finalizar projetos via token" on public.portfolio_projetos;
