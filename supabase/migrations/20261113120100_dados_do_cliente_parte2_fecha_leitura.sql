-- Dados do cliente do projeto (nome e WhatsApp) como dado pessoal — parte 2/2, RESTRITIVA.
-- Aplicar SOMENTE DEPOIS que o app com o serviço `dadosClienteProjeto.service.ts` estiver no ar
-- (deploy do merge da parte 1), senão o app antigo quebra: ele lê essas colunas direto da tabela.
--
-- Tira de anon e authenticated a leitura direta de `cliente_whatsapp` e `cliente_nome`
-- (privilégio por coluna). Quem precisa dos dados usa as funções da parte 1:
-- `dados_cliente_projetos`, `nome_cliente_por_token` e `projetos_do_prestador_por_telefone`.
-- As funções SECURITY DEFINER do banco que já usam essas colunas continuam funcionando.
-- ATENÇÃO: colunas NOVAS em portfolio_projetos precisam de
-- `grant select (coluna) on public.portfolio_projetos to anon, authenticated`.
--
-- Rollback:
--   grant select (cliente_whatsapp, cliente_nome) on public.portfolio_projetos to anon, authenticated;

revoke select (cliente_whatsapp, cliente_nome) on public.portfolio_projetos from anon, authenticated;
