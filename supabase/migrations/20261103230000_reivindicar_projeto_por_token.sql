-- Reivindicação de projeto pelo token (roadmap: "login obrigatório no ciclo do serviço").
--
-- Regra: a primeira conta logada que abre o link do projeto (/acompanhamento/[token]
-- ou /avaliar/[token]) passa a ser a dona do vínculo `portfolio_projetos.cliente_user_id`.
-- Antes, o vínculo só acontecia se o WhatsApp do `profiles` batesse com o do projeto
-- (policy `portfolio_projetos_reivindicar_cliente`); quem entra só com Google normalmente
-- não tem WhatsApp no perfil e nunca era vinculado.
--
-- Por que função e não UPDATE direto do navegador: o token é segredo de portador, e a
-- função concentra a regra em um lugar só (atômica, sem expor UPDATE amplo em
-- `portfolio_projetos`). Não remove a policy antiga: ela continua valendo e cobre o
-- mesmo caso por outro caminho.
--
-- Retornos (texto): vinculado | ja_vinculado | vinculado_outra_conta | prestador_dono |
--                   nao_encontrado | nao_autenticado
--
-- NÃO aplicada automaticamente: rodar pelo console do Supabase, como as demais migrations.

-- 1) Garante a coluna e o índice onde a tabela existir (idempotente; em produção a coluna já existe).
do $$
begin
  if to_regclass('public.portfolio_projetos') is not null then
    alter table public.portfolio_projetos add column if not exists cliente_user_id uuid;
    create index if not exists portfolio_projetos_cliente_user_id_idx
      on public.portfolio_projetos (cliente_user_id);
  end if;
end $$;

-- 2) Função de reivindicação.
create or replace function public.reivindicar_projeto_por_token(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_projeto_id uuid;
  v_cliente uuid;
  v_prestador_user uuid;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select pp.id, pp.cliente_user_id, pr.user_id
    into v_projeto_id, v_cliente, v_prestador_user
    from public.portfolio_projetos pp
    left join public.prestadores pr on pr.id = pp.prestador_id
   where pp.avaliacao_token::text = p_token;

  if v_projeto_id is null then
    return 'nao_encontrado';
  end if;

  if v_cliente is not null then
    return case when v_cliente = v_uid then 'ja_vinculado' else 'vinculado_outra_conta' end;
  end if;

  -- O prestador que abre o próprio link (pré-visualização) não pode virar "cliente".
  if v_prestador_user = v_uid then
    return 'prestador_dono';
  end if;

  update public.portfolio_projetos
     set cliente_user_id = v_uid
   where id = v_projeto_id
     and cliente_user_id is null;

  if found then
    return 'vinculado';
  end if;

  -- Corrida: outra conta vinculou entre o SELECT e o UPDATE.
  select cliente_user_id into v_cliente from public.portfolio_projetos where id = v_projeto_id;
  return case when v_cliente = v_uid then 'ja_vinculado' else 'vinculado_outra_conta' end;
end;
$$;

revoke all on function public.reivindicar_projeto_por_token(text) from public, anon;
grant execute on function public.reivindicar_projeto_por_token(text) to authenticated;
