-- Atividade compatível considera TODAS as atividades registradas no CNPJ (principal e secundárias),
-- como a própria Receita Federal considera. Guardamos só os códigos (7 dígitos); o texto do selo passa a
-- dizer "atividade registrada no CNPJ". Nada de dado pessoal: são códigos de atividade.
alter table public.prestador_cnpj
  add column if not exists cnaes_secundarios text[] not null default '{}';

create or replace function public.selos_publicos(p_prestador_ids bigint[])
returns table (
  prestador_id  bigint,
  tipo          text,
  verificado_em timestamptz,
  valido_ate    date,
  consultado_em timestamptz,
  data_abertura date
)
language sql
stable
security definer
set search_path = ''
as $$
  with cnpj_vigente as (
    select v.prestador_id
      from public.prestador_verificacoes v
     where v.prestador_id = any (p_prestador_ids)
       and v.tipo = 'cnpj'
       and v.status = 'aprovada'
       and (v.valido_ate is null or v.valido_ate >= current_date)
  )
  -- verificações aprovadas e vigentes (hoje: CNPJ)
  select v.prestador_id, v.tipo, v.verificado_em, v.valido_ate,
         c.consultado_em, c.data_abertura
    from public.prestador_verificacoes v
    left join public.prestador_cnpj c
           on v.tipo = 'cnpj' and c.prestador_id = v.prestador_id
   where v.prestador_id = any (p_prestador_ids)
     and v.status = 'aprovada'
     and (v.valido_ate is null or v.valido_ate >= current_date)
  union all
  -- tempo de CNPJ: 1 ano ou mais
  select c.prestador_id, 'tempo_cnpj', null::timestamptz, null::date, c.consultado_em, c.data_abertura
    from public.prestador_cnpj c
    join cnpj_vigente cv on cv.prestador_id = c.prestador_id
   where c.data_abertura is not null
     and c.data_abertura <= current_date - interval '1 year'
  union all
  -- atividade compatível: alguma atividade registrada no CNPJ (principal ou secundária) casa com a categoria
  select c.prestador_id, 'atividade_compativel', null::timestamptz, null::date, c.consultado_em, null::date
    from public.prestador_cnpj c
    join cnpj_vigente cv on cv.prestador_id = c.prestador_id
    join public.prestadores p on p.id = c.prestador_id
   where exists (
     select 1 from public.cnae_categorias m
      where m.categoria_id = p.categoria_id
        and (
          (c.cnae_codigo is not null and c.cnae_codigo like m.cnae_prefixo || '%')
          or exists (select 1 from unnest(c.cnaes_secundarios) s where s like m.cnae_prefixo || '%')
        )
   )
  union all
  -- experiência no PQF (não depende do CNPJ)
  select e.prestador_id, 'experiencia', null::timestamptz, null::date, null::timestamptz, null::date
    from public.experiencia_no_pqf(p_prestador_ids) e
   where e.atingido;
$$;
revoke all on function public.selos_publicos(bigint[]) from public;
grant execute on function public.selos_publicos(bigint[]) to anon, authenticated;
