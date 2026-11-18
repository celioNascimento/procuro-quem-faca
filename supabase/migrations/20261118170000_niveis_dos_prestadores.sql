-- Nível de vários prestadores de uma vez (card da busca com borda da cor do nível).
-- Regra única: Bronze = CNPJ aprovado e vigente; Prata = Bronze + Experiência no PQF. Quem não tem nível não aparece.
create or replace function public.niveis_dos_prestadores(p_prestador_ids bigint[])
returns table (prestador_id bigint, nivel text)
language sql
stable
security definer
set search_path = ''
as $$
  with vigentes as (
    select distinct v.prestador_id
      from public.prestador_verificacoes v
     where v.prestador_id = any (p_prestador_ids)
       and v.tipo = 'cnpj'
       and v.status = 'aprovada'
       and (v.valido_ate is null or v.valido_ate >= current_date)
  ),
  experiencia as materialized (
    select e.prestador_id from public.experiencia_no_pqf(p_prestador_ids) e where e.atingido
  )
  select vg.prestador_id,
         case when exists (select 1 from experiencia x where x.prestador_id = vg.prestador_id)
              then 'prata' else 'bronze' end
    from vigentes vg;
$$;
revoke all on function public.niveis_dos_prestadores(bigint[]) from public;
grant execute on function public.niveis_dos_prestadores(bigint[]) to anon, authenticated;

-- O nível de um prestador passa a vir da mesma regra (uma fonte só).
create or replace function public.nivel_do_prestador(p_prestador_id bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select (select n.nivel from public.niveis_dos_prestadores(array[p_prestador_id]) n limit 1);
$$;
revoke all on function public.nivel_do_prestador(bigint) from public;
grant execute on function public.nivel_do_prestador(bigint) to anon, authenticated;
