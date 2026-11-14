-- A plataforma não trabalha com "orçamento" (usa "Contatos"), e o código não chama mais estas funções.
-- Sobraram no banco como SECURITY DEFINER executáveis por QUALQUER pessoa, sem login
-- (/rest/v1/rpc/obter_orcamento_publico e /rest/v1/rpc/responder_orcamento_publico), lendo e alterando
-- a tabela `orcamentos` a partir de um token. A tabela está vazia hoje, então nada é perdido.
--
-- Esta migração só TIRA a permissão de executar (reversível com um GRANT). Não apaga a tabela nem as
-- funções: apagar é uma decisão à parte (ver o relatório da revisão final do dashboard).

revoke all on function public.obter_orcamento_publico(uuid) from public, anon, authenticated;
revoke all on function public.responder_orcamento_publico(uuid, text) from public, anon, authenticated;
