-- Etapa 2 (selos), Parte B: selos calculados pelo sistema + nível Prata.
--
--  1) Experiência no PQF: 10 serviços avaliados por 10 clientes diferentes. Conta só avaliação finalizada,
--     visível, sem disputa, não ocultada por garantia, com nota efetiva >= 3 e de conta diferente da do
--     próprio prestador. É CALCULADO na hora (nada é gravado): se uma garantia anular uma avaliação, o selo
--     acompanha sozinho.
--  2) Tempo de CNPJ: abertura há 1 ano ou mais (a tela mostra a faixa de 1, 3 ou 5 anos). Só aparece com
--     CNPJ aprovado e vigente (a data vem da Receita).
--  3) Atividade compatível: o CNAE principal do CNPJ casa com a categoria do perfil, pela tabela
--     cnae_categorias (prefixo do CNAE -> categoria). Categoria sem linha na tabela simplesmente não ganha
--     o selo. Só aparece com CNPJ aprovado e vigente.
--  4) Nível: Prata = Bronze (CNPJ ativo) + Experiência no PQF. Formação e conselho entram na Etapa 3.
--     Tempo de CNPJ e Atividade compatível são só informativos e não mudam o nível.
-- Os selos NÃO mudam a ordem da busca. Depende das migrações 20261117150000 e 20261117190000.

-- ---------------------------------------------------------------------------
-- 1) Tabela de mapeamento CNAE -> categoria (só o servidor e as funções abaixo leem)
-- ---------------------------------------------------------------------------
create table if not exists public.cnae_categorias (
  cnae_prefixo text not null check (cnae_prefixo ~ '^[0-9]{4,7}$'),  -- 4 a 7 dígitos; casa pelo começo do código
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  primary key (cnae_prefixo, categoria_id)
);
alter table public.cnae_categorias enable row level security;
revoke all on public.cnae_categorias from public, anon, authenticated;

-- Semente inicial: PRECISA de revisão do dono antes de ir para produção (lista no doc 20).
insert into public.cnae_categorias (cnae_prefixo, categoria_id)
select v.prefixo, c.id
  from (values
    ('Eletricista', '4321500'),
    ('Encanador', '4322301'),
    ('Ar Condicionado', '4322302'),
    ('Pedreiro', '4120400'), ('Pedreiro', '4399103'),
    ('Pintor', '4330404'),
    ('Gesseiro', '4330403'),
    ('Marido de Aluguel', '4399199'), ('Marido de Aluguel', '4330499'), ('Marido de Aluguel', '9529199'),
    ('Mecânica Geral', '4520001'),
    ('Auto Elétrica', '4520002'),
    ('Funilaria e Pintura Automotiva', '4520003'),
    ('Alinhamento e Balanceamento', '4520004'),
    ('Lavagem e Polimento', '4520005'),
    ('Borracharia', '4520006'),
    ('Som e Alarme Automotivo', '4520007'),
    ('Insulfilm e Envelopamento', '4520007'),
    ('Guincho e Reboque', '5229002'),
    ('Cabeleireiro', '9602501'),
    ('Manicure', '9602502'),
    ('Esteticista', '9602502'),
    ('Fisioterapeuta', '8650004'),
    ('Nutricionista', '8650002'),
    ('Personal Trainer', '9313100'), ('Personal Trainer', '8591100'),
    ('Aulas de Idiomas', '8593700'),
    ('Reforço Escolar', '8599699'),
    ('Informática', '9511800'),
    ('Celular e Tablet', '9512600'),
    ('Eletrodomésticos', '9521500'),
    ('Fotógrafo e Filmagem', '7420001'), ('Fotógrafo e Filmagem', '7420002'), ('Fotógrafo e Filmagem', '5911199'),
    ('Marketing Digital', '7311400'), ('Marketing Digital', '7319003'),
    ('Doces e Confeitaria', '1091101'), ('Doces e Confeitaria', '1091102'),
    ('Salgados e Buffet', '5620102'), ('Salgados e Buffet', '5620104'),
    ('Decoração de Festas', '8230001'),
    ('Papelaria Personalizada', '1813001'), ('Papelaria Personalizada', '1813099'),
    ('Diarista', '8121400'), ('Diarista', '9700500'),
    ('Jardineiro', '8130300')
  ) as v(nome, prefixo)
  join public.categorias c on c.nome = v.nome
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2) Experiência no PQF: contagem por prestador (serviços e clientes distintos)
-- ---------------------------------------------------------------------------
create or replace function public.experiencia_no_pqf(p_prestador_ids bigint[])
returns table (prestador_id bigint, servicos int, clientes int, atingido boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id,
         count(distinct a.projeto_id)::int,
         count(distinct a.cliente_id)::int,
         (count(distinct a.projeto_id) >= 10 and count(distinct a.cliente_id) >= 10)
    from public.prestadores p
    join public.avaliacoes a on a.prestador_id = p.id
   where p.id = any (p_prestador_ids)
     and a.status = 'finalizado'
     and a.visivel
     and not coalesce(a.em_disputa, false)
     and not coalesce(a.oculta_por_garantia, false)
     and coalesce(a.nota_efetiva, a.nota) >= 3
     and a.cliente_id is not null
     and a.cliente_id is distinct from p.user_id
   group by p.id;
$$;
revoke all on function public.experiencia_no_pqf(bigint[]) from public;
grant execute on function public.experiencia_no_pqf(bigint[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Nível: Bronze (CNPJ ativo) e Prata (Bronze + Experiência no PQF)
-- ---------------------------------------------------------------------------
create or replace function public.nivel_do_prestador(p_prestador_id bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not exists (
      select 1 from public.prestador_verificacoes v
      where v.prestador_id = p_prestador_id
        and v.tipo = 'cnpj'
        and v.status = 'aprovada'
        and (v.valido_ate is null or v.valido_ate >= current_date)
    ) then null
    when exists (
      select 1 from public.experiencia_no_pqf(array[p_prestador_id]) e where e.atingido
    ) then 'prata'
    else 'bronze'
  end;
$$;
revoke all on function public.nivel_do_prestador(bigint) from public;
grant execute on function public.nivel_do_prestador(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Selos públicos: mesma assinatura de antes, com os tipos novos
--    'experiencia' | 'tempo_cnpj' (data_abertura preenchida) | 'atividade_compativel'
-- ---------------------------------------------------------------------------
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
  -- atividade compatível: CNAE principal casa com a categoria do perfil
  select c.prestador_id, 'atividade_compativel', null::timestamptz, null::date, c.consultado_em, null::date
    from public.prestador_cnpj c
    join cnpj_vigente cv on cv.prestador_id = c.prestador_id
    join public.prestadores p on p.id = c.prestador_id
   where c.cnae_codigo is not null
     and exists (
       select 1 from public.cnae_categorias m
        where m.categoria_id = p.categoria_id
          and c.cnae_codigo like m.cnae_prefixo || '%'
     )
  union all
  -- experiência no PQF (não depende do CNPJ)
  select e.prestador_id, 'experiencia', null::timestamptz, null::date, null::timestamptz, null::date
    from public.experiencia_no_pqf(p_prestador_ids) e
   where e.atingido;
$$;
revoke all on function public.selos_publicos(bigint[]) from public;
grant execute on function public.selos_publicos(bigint[]) to anon, authenticated;
