-- Avaliação do projeto: somente a conta DONA do projeto (portfolio_projetos.cliente_user_id).
--
-- Problema (conferido no banco em 04/11/2026): qualquer conta logada podia inserir uma
-- avaliação para qualquer projeto/prestador (policy "Clientes logados podem avaliar":
-- check auth.role() = 'authenticated'), e qualquer visitante anônimo podia finalizar
-- projetos (policy "Clientes podem finalizar projetos via token"). Além disso o app não
-- gravava `cliente_id`, então o trigger check_auto_avaliacao nunca barrava auto-avaliação.
--
-- Esta migration é ADITIVA (só cria a função) e pode ser aplicada antes do deploy do app.
-- O fechamento das policies abertas está em 20261104190100_fecha_escrita_aberta_avaliacao.sql
-- e só deve ser aplicado DEPOIS do deploy do app que chama esta função.
--
-- Regras (espelham a interface, agora garantidas no banco):
--   * exige login; o projeto precisa ter dono e o dono ser quem chama;
--   * projeto em 'em_execucao' com conclusão registrada (foto da etapa 3, ou
--     marcado_concluido_at quando sem_fotos);
--   * uma avaliação finalizada por projeto;
--   * nota de 1 a 5.
-- Efeito atômico: grava a avaliação (com cliente_id = auth.uid(), o que ativa o trigger de
-- auto-avaliação) e finaliza o projeto.
--
-- Retornos (texto): avaliado | nao_autenticado | nao_encontrado | sem_vinculo | nao_e_dono |
--                   projeto_nao_concluido | ja_avaliado | nota_invalida
--
-- NÃO aplicada automaticamente: rodar pelo console do Supabase.

create or replace function public.avaliar_projeto(
  p_projeto_id uuid,
  p_nota integer,
  p_comentario text,
  p_indica boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prestador_id public.portfolio_projetos.prestador_id%type;
  v_dono uuid;
  v_status text;
  v_sem_fotos boolean;
  v_marcado_concluido timestamptz;
  v_cliente_nome text;
  v_concluido boolean;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if p_nota is null or p_nota < 1 or p_nota > 5 then
    return 'nota_invalida';
  end if;

  -- Trava a linha: dois envios simultâneos não criam duas avaliações.
  select pp.prestador_id, pp.cliente_user_id, pp.status, pp.sem_fotos,
         pp.marcado_concluido_at, pp.cliente_nome
    into v_prestador_id, v_dono, v_status, v_sem_fotos, v_marcado_concluido, v_cliente_nome
    from public.portfolio_projetos pp
   where pp.id = p_projeto_id
     for update of pp;

  if not found then
    return 'nao_encontrado';
  end if;

  if v_dono is null then
    return 'sem_vinculo';
  end if;

  if v_dono <> v_uid then
    return 'nao_e_dono';
  end if;

  if exists (
    select 1 from public.avaliacoes a
     where a.projeto_id = p_projeto_id and a.status = 'finalizado'
  ) then
    return 'ja_avaliado';
  end if;

  -- Mesma regra da interface (podeAvaliar em app/acompanhamento/[token]/page.tsx).
  v_concluido := case
    when coalesce(v_sem_fotos, false) then v_marcado_concluido is not null
    else exists (select 1 from public.portfolio_fotos f where f.projeto_id = p_projeto_id and f.ordem = 3)
  end;

  if v_status <> 'em_execucao' or not v_concluido then
    return 'projeto_nao_concluido';
  end if;

  insert into public.avaliacoes
    (projeto_id, prestador_id, cliente_id, nota, comentario, indica, visivel, status, cliente_nome)
  values
    (p_projeto_id, v_prestador_id, v_uid, p_nota, coalesce(p_comentario, ''), coalesce(p_indica, false),
     true, 'finalizado', v_cliente_nome);

  update public.portfolio_projetos
     set status = 'finalizado',
         data_conclusao = current_date
   where id = p_projeto_id;

  return 'avaliado';
end;
$$;

revoke all on function public.avaliar_projeto(uuid, integer, text, boolean) from public, anon;
grant execute on function public.avaliar_projeto(uuid, integer, text, boolean) to authenticated;
