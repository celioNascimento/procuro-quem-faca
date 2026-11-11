-- NÃO APLICADO AINDA. Aplicar SOMENTE DEPOIS do deploy do app com o login sem esta função
-- (hooks/useLoginForm.ts passa a chamar resetPasswordForEmail direto). Antes do deploy, o
-- "esqueci a senha" ainda depende dela.
--
-- A função deixava qualquer pessoa descobrir, pela API pública, se um e-mail tem conta (enumeração de
-- usuários). Sai junto com a tabela de limite de tentativas, que guarda e-mails digitados.
drop function if exists public.verificar_usuario_existe(text);
drop table if exists public.rate_limit_verificar_email;
