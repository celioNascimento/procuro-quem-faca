-- JÁ APLICADO NO BANCO em 10/11/2026 (arquivo para versionar). Idempotente.
-- Acrescenta "login" às origens permitidas: aceite pedido pela tela exibida depois do login.
alter table public.consentimentos drop constraint if exists consentimentos_origem_check;
alter table public.consentimentos add constraint consentimentos_origem_check
  check (origem = any (array['cadastro_prestador','cadastro_cliente','upload_foto','painel','login','outro']));
