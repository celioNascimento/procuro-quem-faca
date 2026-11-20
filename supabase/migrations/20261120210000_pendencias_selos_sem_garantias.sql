-- Painel admin, passo 2 (plano claude/avaliacao-painel-admin.md): contador de pendências.
--
-- 1) Entram os selos que esperam decisão de uma pessoa:
--      selos_cnpj_abertos        CNPJ em fila (status 'pendente' ou 'em_analise'), a mesma lista da aba CNPJ
--      selos_documentos_abertos  pedidos de Seguro ou CND em análise (dados ? 'pedido'), a mesma lista da aba Seguro e CND
-- 2) Saem garantias e contestações: o admin não tem tela para tratar nenhuma das duas (garantia corre entre
--    cliente e prestador; a tabela contestacoes está vazia e nenhum código lê dela). A tabela fica como está.
--
-- Só muda o corpo de contar_pendencias(): as permissões são mantidas por create or replace e
-- admin_pendencias() continua chamando esta função. O app aceita as duas versões do JSON
-- (chave que não existe vira zero), então a ordem entre migration e deploy não importa.

create or replace function public.contar_pendencias()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'titular_abertas',
      (select count(*) from public.solicitacoes_titular where status in ('recebida', 'em_analise')),
    'titular_atrasadas',
      (select count(*) from public.solicitacoes_titular
        where status in ('recebida', 'em_analise') and prazo_resposta < current_date),
    'denuncias_abertas',
      (select count(*) from public.denuncias where status = 'aberta'),
    'selos_cnpj_abertos',
      (select count(*) from public.prestador_verificacoes
        where tipo = 'cnpj' and status in ('pendente', 'em_analise')),
    'selos_documentos_abertos',
      (select count(*) from public.prestador_verificacoes
        where tipo in ('seguro', 'cnd') and dados ? 'pedido')
  );
$function$;
