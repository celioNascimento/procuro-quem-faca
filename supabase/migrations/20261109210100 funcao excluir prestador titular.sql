-- Exclusão de prestador a pedido do titular (oposição/exclusão), para perfis SEM conta
-- (origem curadoria_publica). Apaga o perfil e tudo que cascateia dele; mantém apenas
-- registros anônimos (avaliações sem prestador, cliente ou texto; denúncias sem prestador).
-- Perfis com conta usam o fluxo de exclusão de conta do próprio titular.
create or replace function public.excluir_prestador_titular(
  p_prestador_id bigint,
  p_solicitacao_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_aval integer := 0;
  v_den integer := 0;
  v_resultado jsonb;
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores podem excluir prestadores' using errcode = '42501';
  end if;

  select user_id into v_user_id
    from public.prestadores
   where id = p_prestador_id;

  if not found then
    raise exception 'Prestador não encontrado' using errcode = 'P0002';
  end if;

  if v_user_id is not null then
    raise exception 'Prestador com conta: use a exclusão de conta' using errcode = '22023';
  end if;

  -- Mantém só o dado anônimo das avaliações já feitas
  update public.avaliacoes
     set prestador_id = null,
         projeto_id = null,
         cliente_id = null,
         cliente_nome = 'Cliente anonimizado',
         cliente_foto_url = null,
         comentario = null,
         resposta_prestador = null
   where prestador_id = p_prestador_id;
  get diagnostics v_aval = row_count;

  update public.denuncias
     set prestador_id = null
   where prestador_id = p_prestador_id;
  get diagnostics v_den = row_count;

  -- Cascata: cliques, visitas_perfil, portfolio, orçamentos, catálogo, garantias
  delete from public.prestadores where id = p_prestador_id;

  v_resultado := jsonb_build_object(
    'avaliacoes_anonimizadas', v_aval,
    'denuncias_desvinculadas', v_den
  );

  if p_solicitacao_id is not null then
    update public.solicitacoes_titular
       set status = 'atendida',
           respondido_em = now(),
           atendido_por = (select auth.uid()),
           updated_at = now()
     where id = p_solicitacao_id;
  end if;

  insert into public.logs_atividades (acao, usuario_id, entidade_tipo, entidade_id, detalhes)
  values (
    'EXCLUSAO_PRESTADOR_TITULAR',
    (select auth.uid()),
    'prestador',
    p_prestador_id::text,
    v_resultado || jsonb_build_object('solicitacao_id', p_solicitacao_id)
  );

  return v_resultado;
end;
$function$;

revoke all on function public.excluir_prestador_titular(bigint, uuid) from public, anon;
grant execute on function public.excluir_prestador_titular(bigint, uuid) to authenticated, service_role;
