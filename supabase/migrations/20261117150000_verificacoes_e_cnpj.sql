-- Etapa 2 do plano de confiança (doc 19): estrutura comum de verificações + consulta de CNPJ.
--
--  1) prestador_verificacoes: uma linha por prestador e tipo de verificação (cnpj, formacao, conselho,
--     seguro, cnd). As Etapas 3 a 5 reaproveitam esta mesma tabela.
--  2) prestador_cnpj: o que foi conferido na Receita (dados abertos). Privada: só o dono do perfil e o admin leem.
--  3) Escrita SOMENTE pelo servidor (rota da aplicação com a chave de serviço). Nem o prestador nem o
--     admin inserem direto: o admin só decide (aprova/rejeita) pela fila de revisão.
--  4) Funções públicas e seguras: selos_publicos() e nivel_do_prestador(), que expõem só o que a vitrine precisa.
--
-- O nível do prestador é sempre CALCULADO a partir das verificações aprovadas, nunca editado à mão.
-- O boolean prestadores.verificado fica sem uso e será removido em migração posterior.
-- Depende de public.is_admin() (criada fora das migrations).

-- ---------------------------------------------------------------------------
-- 1) Verificações
-- ---------------------------------------------------------------------------
create table if not exists public.prestador_verificacoes (
  id                uuid primary key default gen_random_uuid(),
  prestador_id      bigint not null references public.prestadores (id) on delete cascade,
  tipo              text not null check (tipo in ('cnpj', 'formacao', 'conselho', 'seguro', 'cnd')),
  status            text not null default 'pendente'
                      check (status in ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'expirada')),
  dados             jsonb not null default '{}'::jsonb,   -- resumo do que foi conferido, sem o documento
  valido_ate        date,
  pais              text not null default 'BR',
  fonte_validacao   text,                                 -- ex.: brasilapi, minhareceita, receitaws, curadoria_manual
  verificado_por    uuid references auth.users (id) on delete set null,
  verificado_em     timestamptz,
  conflito_parceiro boolean not null default false,       -- regra 6 do plano: relação com parceiro comercial
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  unique (prestador_id, tipo)
);

create index if not exists prestador_verificacoes_fila_idx
  on public.prestador_verificacoes (status, criado_em)
  where status in ('pendente', 'em_analise');

-- ---------------------------------------------------------------------------
-- 2) Dados do CNPJ
-- ---------------------------------------------------------------------------
create table if not exists public.prestador_cnpj (
  id               uuid primary key default gen_random_uuid(),
  prestador_id     bigint not null unique references public.prestadores (id) on delete cascade,
  -- 14 caracteres; desde 31/07/2026 os 12 primeiros podem ter letras (CNPJ alfanumérico), os 2 últimos são dígitos
  cnpj             text not null unique check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'),
  razao_social     text,            -- de MEI: SEM os dígitos do CPF que a Receita acrescenta ao nome
  nome_fantasia    text,
  situacao         text,            -- ex.: ATIVA, BAIXADA, SUSPENSA, INAPTA
  porte            text,
  natureza_juridica text,
  mei              boolean not null default false,
  cnae_codigo      text,
  cnae_descricao   text,
  data_abertura    date,
  consultado_em    timestamptz not null default now(),
  fonte            text not null,   -- qual fonte respondeu
  criado_em        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Carimbo de atualização
-- ---------------------------------------------------------------------------
create or replace function public.verificacoes_carimbar_atualizacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists prestador_verificacoes_atualizado on public.prestador_verificacoes;
create trigger prestador_verificacoes_atualizado
  before update on public.prestador_verificacoes
  for each row execute function public.verificacoes_carimbar_atualizacao();

-- ---------------------------------------------------------------------------
-- 3) Acesso: leitura do dono e do admin; decisão só do admin; escrita de dados só pelo servidor
-- ---------------------------------------------------------------------------
alter table public.prestador_verificacoes enable row level security;
alter table public.prestador_cnpj          enable row level security;

drop policy if exists "verificacoes_select_dono_ou_admin" on public.prestador_verificacoes;
create policy "verificacoes_select_dono_ou_admin" on public.prestador_verificacoes for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.prestadores p
      where p.id = prestador_verificacoes.prestador_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "verificacoes_update_admin" on public.prestador_verificacoes;
create policy "verificacoes_update_admin" on public.prestador_verificacoes for update to authenticated
  using ((select public.is_admin()))
  with check (
    (select public.is_admin())
    and status in ('em_analise', 'aprovada', 'rejeitada')
  );

drop policy if exists "cnpj_select_dono_ou_admin" on public.prestador_cnpj;
create policy "cnpj_select_dono_ou_admin" on public.prestador_cnpj for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.prestadores p
      where p.id = prestador_cnpj.prestador_id and p.user_id = (select auth.uid())
    )
  );

revoke all on public.prestador_verificacoes from public, anon, authenticated;
revoke all on public.prestador_cnpj          from public, anon, authenticated;
grant select on public.prestador_verificacoes to authenticated;
grant select on public.prestador_cnpj          to authenticated;
-- O admin só decide: três colunas, e só com a regra de linha acima.
grant update (status, verificado_por, verificado_em) on public.prestador_verificacoes to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Funções públicas: só o que a vitrine precisa, sem o CNPJ nem a razão social
-- ---------------------------------------------------------------------------
-- Nível calculado. Hoje só existe o Bronze (CNPJ ativo aprovado e dentro da validade).
create or replace function public.nivel_do_prestador(p_prestador_id bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.prestador_verificacoes v
      where v.prestador_id = p_prestador_id
        and v.tipo = 'cnpj'
        and v.status = 'aprovada'
        and (v.valido_ate is null or v.valido_ate >= current_date)
    ) then 'bronze'
  end;
$$;
revoke all on function public.nivel_do_prestador(bigint) from public;
grant execute on function public.nivel_do_prestador(bigint) to anon, authenticated;

-- Selos aprovados e vigentes de vários prestadores de uma vez (cards da busca e perfil público).
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
  select v.prestador_id, v.tipo, v.verificado_em, v.valido_ate,
         c.consultado_em, c.data_abertura
    from public.prestador_verificacoes v
    left join public.prestador_cnpj c
           on v.tipo = 'cnpj' and c.prestador_id = v.prestador_id
   where v.prestador_id = any (p_prestador_ids)
     and v.status = 'aprovada'
     and (v.valido_ate is null or v.valido_ate >= current_date);
$$;
revoke all on function public.selos_publicos(bigint[]) from public;
grant execute on function public.selos_publicos(bigint[]) to anon, authenticated;
