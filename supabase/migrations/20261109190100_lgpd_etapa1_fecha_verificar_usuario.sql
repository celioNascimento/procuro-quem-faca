-- LGPD, Etapa 1 (parte 2/2, RESTRITIVA): fecha a RPC verificar_usuario_existe.
-- Aplicar SOMENTE DEPOIS que o app sem essa chamada (hooks/useLoginForm.ts) estiver no ar
-- (deploy do merge), senão o "esqueci minha senha" do app antigo quebra.
--
-- Motivo: a função devolvia true/false para qualquer e-mail, chamada sem login em
-- /rest/v1/rpc/verificar_usuario_existe. O limite de 5 tentativas por e-mail não impede
-- varrer vários e-mails, então ela permitia descobrir quem tem conta no PQF.
-- O app passa a chamar auth.resetPasswordForEmail direto, que não revela se a conta existe.
--
-- Rollback (comentado):
--   grant execute on function public.verificar_usuario_existe(text) to anon, authenticated;

revoke execute on function public.verificar_usuario_existe(text) from public, anon, authenticated;
