-- Token do projeto como segredo (parte 2/2 — RESTRITIVA).
-- Aplicar SOMENTE DEPOIS que o app com as funções da parte 1 estiver no ar (deploy do merge),
-- senão o app antigo quebra (ele lê avaliacao_token e aceita/vincula por WhatsApp).
--
-- 1) Remove os caminhos de vínculo/aceite por WhatsApp: `profiles.whatsapp` é editável pelo
--    próprio usuário e `cliente_whatsapp` é legível, então qualquer conta podia se declarar
--    dona de um projeto. O vínculo passa a ser só pelo token (reivindicar_projeto_por_token).
-- 2) Impede que escrita direta pelo navegador (prestador/cliente) defina `cliente_user_id`;
--    só as funções SECURITY DEFINER (current_user = postgres) podem.
-- 3) Tira a leitura pública de `avaliacao_token` (privilégio por coluna). Ler o token agora
--    só via tokens_projetos(). ATENÇÃO: colunas NOVAS em portfolio_projetos precisam de
--    `grant select (coluna) on public.portfolio_projetos to anon, authenticated`.
--
-- Rollback (comentado):
--   grant select on public.portfolio_projetos to anon, authenticated;
--   drop trigger if exists trg_portfolio_projetos_protege_vinculo on public.portfolio_projetos;
--   (recriar as policies removidas, definição no histórico desta migration)

drop policy if exists "portfolio_projetos_reivindicar_cliente" on public.portfolio_projetos;
drop policy if exists "portfolio_projetos_cliente_aceita_proprio" on public.portfolio_projetos;

create or replace function public.protege_vinculo_cliente()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' and new.cliente_user_id is not null then
      raise exception 'cliente_user_id não pode ser definido diretamente' using errcode = '42501';
    elsif tg_op = 'UPDATE' and new.cliente_user_id is distinct from old.cliente_user_id then
      raise exception 'cliente_user_id não pode ser alterado diretamente' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_portfolio_projetos_protege_vinculo on public.portfolio_projetos;
create trigger trg_portfolio_projetos_protege_vinculo
  before insert or update on public.portfolio_projetos
  for each row execute function public.protege_vinculo_cliente();

revoke select on public.portfolio_projetos from anon, authenticated;
grant select (
  id, prestador_id, titulo, descricao, data_conclusao, created_at, data_inicio,
  cliente_whatsapp, status, cliente_nome, aceito_at, cliente_user_id, sem_fotos,
  marcado_concluido_at
) on public.portfolio_projetos to anon, authenticated;
