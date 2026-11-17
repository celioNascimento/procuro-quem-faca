-- Etapa 2 (selos), Parte A: fila de revisão do CNPJ no painel admin.
--
-- Duas funções só para administradores (mesmo padrão de admin_bloquear_prestador):
--  1) admin_fila_verificacoes(filtro): lista as verificações de CNPJ com o que a Receita devolveu.
--  2) admin_decidir_verificacao(id, decisao, motivo): aprova ou rejeita (ou revoga um selo já aprovado).
--
-- Por que funções e não UPDATE direto: rejeitar ou revogar precisa APAGAR a linha de prestador_cnpj
-- (libera o CNPJ para outro perfil), e o admin não tem DELETE nessa tabela. A função faz tudo numa
-- transação só e confere duas regras no banco, não só na tela:
--   - só aprova se a Receita disse que o CNPJ está ATIVA;
--   - o selo aprovado vale 35 dias (mesma validade da aprovação automática); a reconsulta mensal renova.
-- Depende de public.is_admin() e da migração 20261117150000_verificacoes_e_cnpj.sql.

create or replace function public.admin_fila_verificacoes(p_filtro text default 'pendentes')
returns table (
  verificacao_id  uuid,
  prestador_id    bigint,
  prestador_nome  text,
  prestador_slug  text,
  status          text,
  motivo          text,
  criado_em       timestamptz,
  verificado_em   timestamptz,
  cnpj            text,
  razao_social    text,
  nome_fantasia   text,
  situacao        text,
  mei             boolean,
  consultado_em   timestamptz,
  fonte           text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_status text[];
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;

  v_status := case p_filtro
    when 'pendentes'  then array['pendente', 'em_analise']
    when 'aprovadas'  then array['aprovada']
    when 'rejeitadas' then array['rejeitada']
    else null
  end;
  if v_status is null then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;

  return query
    select v.id, v.prestador_id, p.nome, p.slug, v.status, v.dados ->> 'motivo',
           v.criado_em, v.verificado_em,
           c.cnpj, c.razao_social, c.nome_fantasia, c.situacao, c.mei, c.consultado_em, c.fonte
      from public.prestador_verificacoes v
      join public.prestadores p on p.id = v.prestador_id
      left join public.prestador_cnpj c on c.prestador_id = v.prestador_id
     where v.tipo = 'cnpj'
       and v.status = any (v_status)
     order by v.criado_em asc;
end;
$$;

revoke all on function public.admin_fila_verificacoes(text) from public, anon;
grant execute on function public.admin_fila_verificacoes(text) to authenticated, service_role;

create or replace function public.admin_decidir_verificacao(
  p_verificacao_id uuid,
  p_decisao        text,
  p_motivo         text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.prestador_verificacoes%rowtype;
  v_situacao text;
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  if p_decisao not in ('aprovada', 'rejeitada') then
    raise exception 'Decisão inválida' using errcode = '22023';
  end if;

  select * into v from public.prestador_verificacoes where id = p_verificacao_id for update;
  if not found then
    raise exception 'Verificação não encontrada' using errcode = 'P0002';
  end if;
  if v.tipo <> 'cnpj' then
    raise exception 'Esta tela só decide verificações de CNPJ' using errcode = '22023';
  end if;
  if v.status = 'rejeitada' then
    raise exception 'Esta verificação já foi rejeitada' using errcode = '22023';
  end if;
  if v.status = 'aprovada' and p_decisao = 'aprovada' then
    raise exception 'Esta verificação já está aprovada' using errcode = '22023';
  end if;

  if p_decisao = 'aprovada' then
    select c.situacao into v_situacao from public.prestador_cnpj c where c.prestador_id = v.prestador_id;
    if v_situacao is distinct from 'ATIVA' then
      raise exception 'Só é possível aprovar CNPJ com situação ATIVA' using errcode = '22023';
    end if;
  end if;

  update public.prestador_verificacoes
     set status        = p_decisao,
         verificado_por = (select auth.uid()),
         verificado_em  = now(),
         valido_ate     = case when p_decisao = 'aprovada' then current_date + 35 else null end,
         dados          = dados || jsonb_build_object(
                            'decisao', jsonb_build_object(
                              'resultado', p_decisao,
                              'motivo', nullif(btrim(coalesce(p_motivo, '')), ''),
                              'em', now()))
   where id = p_verificacao_id;

  -- Rejeitar ou revogar libera o CNPJ para outro perfil.
  if p_decisao = 'rejeitada' then
    delete from public.prestador_cnpj where prestador_id = v.prestador_id;
  end if;
end;
$$;

revoke all on function public.admin_decidir_verificacao(uuid, text, text) from public, anon;
grant execute on function public.admin_decidir_verificacao(uuid, text, text) to authenticated, service_role;
