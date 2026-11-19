-- CNPJ que deixou de ser ATIVO na reverificação diária: o selo é pausado e o prestador é avisado
-- no painel para regularizar. Não vai mais para a fila do admin (a equipe não tem o que decidir:
-- só a regularização na Receita muda isso). Status 'expirada' + motivo 'situacao_nao_ativa'.
-- O prestador informa o CNPJ de novo depois de regularizar; a confirmação volta a ser automática.
create or replace function public.cnpj_registrar_reverificacao(
  p_prestador_id bigint,
  p_situacao     text,
  p_fonte        text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id
    from public.prestador_verificacoes
   where prestador_id = p_prestador_id and tipo = 'cnpj' and status = 'aprovada'
   for update;
  if not found then
    return 'ignorada';
  end if;

  update public.prestador_cnpj
     set situacao = upper(btrim(coalesce(p_situacao, ''))),
         fonte = coalesce(nullif(btrim(coalesce(p_fonte, '')), ''), fonte),
         consultado_em = now()
   where prestador_id = p_prestador_id;

  if upper(btrim(coalesce(p_situacao, ''))) = 'ATIVA' then
    update public.prestador_verificacoes
       set valido_ate = current_date + 35,
           verificado_em = now(),
           fonte_validacao = coalesce(nullif(btrim(coalesce(p_fonte, '')), ''), fonte_validacao),
           dados = dados || jsonb_build_object('situacao', 'ATIVA', 'reverificado_em', now()),
           atualizado_em = now()
     where id = v_id;
    return 'renovada';
  end if;

  update public.prestador_verificacoes
     set status = 'expirada',
         valido_ate = null,
         verificado_em = null,
         verificado_por = null,
         dados = dados || jsonb_build_object(
                   'motivo', 'situacao_nao_ativa',
                   'situacao', upper(btrim(coalesce(p_situacao, ''))),
                   'origem', 'reverificacao',
                   'reverificado_em', now()),
         atualizado_em = now()
   where id = v_id;
  return 'selo_pausado';
end;
$$;

revoke all on function public.cnpj_registrar_reverificacao(bigint, text, text) from public, anon, authenticated;
grant execute on function public.cnpj_registrar_reverificacao(bigint, text, text) to service_role;
