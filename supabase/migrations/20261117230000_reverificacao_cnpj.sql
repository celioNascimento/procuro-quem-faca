-- Etapa 2 (selos), Parte A: rotina diária que mantém o selo de CNPJ em dia.
--
-- A rota /api/cron/cnpj-reverificacao (cron da Vercel) consulta a Receita; o banco decide e grava.
-- Cada selo vale 35 dias. Quando faltam 5 dias ou menos, o cron reconsulta o CNPJ, uma vez por dia
-- até conseguir (assim, se as fontes da Receita estiverem fora do ar, tenta de novo no dia seguinte):
--   - CNPJ ainda ATIVA  -> renova por mais 35 dias (o nome não é reconferido: o vínculo já foi aprovado);
--   - CNPJ não ATIVA    -> o selo cai na hora e o caso vai para a fila do admin (status pendente,
--                          motivo situacao_nao_ativa); o prestador vê o aviso na aba CNPJ;
--   - sem resposta das fontes -> nada muda; se a validade vencer, o selo expira sozinho.
-- Todas as funções são só do servidor (chave de serviço). Nada aqui é chamável pelo navegador.
-- Depende da migração 20261117150000_verificacoes_e_cnpj.sql e de 20261117190000_cache_consulta_cnpj.sql.

-- 1) Quem precisa ser reconsultado (os que vencem primeiro vêm antes).
create or replace function public.cnpj_reverificacao_pendentes(p_limite int default 20)
returns table (prestador_id bigint, cnpj text)
language sql
stable
security definer
set search_path = ''
as $$
  select v.prestador_id, c.cnpj
    from public.prestador_verificacoes v
    join public.prestador_cnpj c on c.prestador_id = v.prestador_id
   where v.tipo = 'cnpj'
     and v.status = 'aprovada'
     and v.valido_ate is not null
     and v.valido_ate <= current_date + 5
   order by v.valido_ate asc
   limit greatest(coalesce(p_limite, 20), 1);
$$;

-- 2) Grava o resultado de uma reconsulta. Só age sobre selo que ainda está aprovado
--    (se o admin revogou no meio do caminho, não desfaz a decisão dele).
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
     set status = 'pendente',
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
  return 'enviada_para_fila';
end;
$$;

-- 3) Selo cuja validade passou sem renovar: vira 'expirada' (a vitrine já o esconde pela data;
--    isto só deixa o status coerente). Devolve quantos foram expirados.
create or replace function public.cnpj_expirar_vencidos()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qtd int;
begin
  update public.prestador_verificacoes
     set status = 'expirada', atualizado_em = now()
   where tipo = 'cnpj' and status = 'aprovada'
     and valido_ate is not null and valido_ate < current_date;
  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

-- 4) Limpa o cache de consultas vencido (guarda nomes de sócios por 24h; nada além disso fica).
create or replace function public.cnpj_limpar_cache()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qtd int;
begin
  delete from public.cnpj_consultas_cache where expira_em < now();
  get diagnostics v_qtd = row_count;
  return v_qtd;
end;
$$;

revoke all on function public.cnpj_reverificacao_pendentes(int) from public, anon, authenticated;
revoke all on function public.cnpj_registrar_reverificacao(bigint, text, text) from public, anon, authenticated;
revoke all on function public.cnpj_expirar_vencidos() from public, anon, authenticated;
revoke all on function public.cnpj_limpar_cache() from public, anon, authenticated;
grant execute on function public.cnpj_reverificacao_pendentes(int) to service_role;
grant execute on function public.cnpj_registrar_reverificacao(bigint, text, text) to service_role;
grant execute on function public.cnpj_expirar_vencidos() to service_role;
grant execute on function public.cnpj_limpar_cache() to service_role;
