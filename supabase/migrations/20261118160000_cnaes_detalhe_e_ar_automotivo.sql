-- 1) Ar Condicionado Automotivo usa o CNAE 4520-0/07 (instalação, manutenção e reparação de acessórios para
--    veículos automotores), conferido com o dono em 18/11. Compartilha o código com Insulfilm e Som/Alarme.
insert into public.cnae_categorias (cnae_prefixo, categoria_id)
select '4520007', c.id from public.categorias c where c.nome = 'Ar Condicionado Automotivo'
on conflict do nothing;

-- 2) Descrições das atividades secundárias, só para o prestador ver o detalhe no painel.
--    Formato: [{"codigo":"4520007","descricao":"..."}]. A conferência do selo continua usando cnaes_secundarios.
alter table public.prestador_cnpj
  add column if not exists cnaes_detalhe jsonb not null default '[]'::jsonb;

-- 3) Quais atividades registradas no CNPJ combinam com a categoria do perfil. Só o dono do perfil consulta.
create or replace function public.cnaes_compativeis_do_prestador(p_prestador_id bigint)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct a.codigo), '{}')
    from public.prestadores p
    join public.prestador_cnpj c on c.prestador_id = p.id
    cross join lateral (
      select c.cnae_codigo as codigo where c.cnae_codigo is not null
      union
      select s from unnest(c.cnaes_secundarios) s
    ) a
    join public.cnae_categorias m on m.categoria_id = p.categoria_id and a.codigo like m.cnae_prefixo || '%'
   where p.id = p_prestador_id
     and p.user_id = (select auth.uid());
$$;
revoke all on function public.cnaes_compativeis_do_prestador(bigint) from public, anon;
grant execute on function public.cnaes_compativeis_do_prestador(bigint) to authenticated;
