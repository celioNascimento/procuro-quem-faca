-- Token do projeto como segredo (parte 1/2 — ADITIVA, aplicar ANTES do deploy do app).
--
-- Problema: `portfolio_projetos.avaliacao_token` é lido por qualquer visitante (policies
-- SELECT true), então qualquer um podia listar tokens e "reivindicar" o projeto de outro,
-- inclusive para avaliar. Esta parte cria os caminhos controlados que o app passa a usar;
-- a parte 2 (20261105190100) tira a leitura pública do token.
--
-- Funções (todas exigem login; SECURITY DEFINER):
--   projeto_id_por_token(text)      -> uuid   id do projeto cujo token foi informado (ou null)
--   tokens_projetos(uuid[])         -> (projeto_id, avaliacao_token) só dos projetos em que o
--                                              chamador é o cliente dono OU o prestador do projeto
--   aceitar_projeto(uuid, text)     -> text   somente o cliente dono: pendente -> em_execucao
--   recusar_projeto(uuid)           -> text   somente o cliente dono: pendente -> recusado
-- Retornos de aceitar/recusar: ok | nao_autenticado | nao_encontrado | nao_e_dono | status_invalido

create or replace function public.projeto_id_por_token(p_token text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  begin
    v_token := p_token::uuid;
  exception when invalid_text_representation then
    return null;
  end;
  select id into v_id from public.portfolio_projetos where avaliacao_token = v_token;
  return v_id;
end;
$$;

create or replace function public.tokens_projetos(p_ids uuid[])
returns table (projeto_id uuid, avaliacao_token uuid)
language sql
stable
security definer
set search_path = public
as $$
  select pp.id, pp.avaliacao_token
    from public.portfolio_projetos pp
    left join public.prestadores pr on pr.id = pp.prestador_id
   where auth.uid() is not null
     and pp.id = any (p_ids)
     and (pp.cliente_user_id = auth.uid() or pr.user_id = auth.uid());
$$;

create or replace function public.aceitar_projeto(p_projeto_id uuid, p_nome text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_dono uuid;
  v_status text;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  select cliente_user_id, status into v_dono, v_status
    from public.portfolio_projetos where id = p_projeto_id for update;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is distinct from v_uid then return 'nao_e_dono'; end if;
  if v_status <> 'pendente' then return 'status_invalido'; end if;
  update public.portfolio_projetos
     set status = 'em_execucao',
         aceito_at = now(),
         cliente_nome = coalesce(nullif(btrim(p_nome), ''), cliente_nome)
   where id = p_projeto_id;
  return 'ok';
end;
$$;

create or replace function public.recusar_projeto(p_projeto_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_dono uuid;
  v_status text;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  select cliente_user_id, status into v_dono, v_status
    from public.portfolio_projetos where id = p_projeto_id for update;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is distinct from v_uid then return 'nao_e_dono'; end if;
  if v_status <> 'pendente' then return 'status_invalido'; end if;
  update public.portfolio_projetos set status = 'recusado' where id = p_projeto_id;
  return 'ok';
end;
$$;

revoke all on function public.projeto_id_por_token(text) from public, anon;
revoke all on function public.tokens_projetos(uuid[]) from public, anon;
revoke all on function public.aceitar_projeto(uuid, text) from public, anon;
revoke all on function public.recusar_projeto(uuid) from public, anon;
grant execute on function public.projeto_id_por_token(text) to authenticated;
grant execute on function public.tokens_projetos(uuid[]) to authenticated;
grant execute on function public.aceitar_projeto(uuid, text) to authenticated;
grant execute on function public.recusar_projeto(uuid) to authenticated;
