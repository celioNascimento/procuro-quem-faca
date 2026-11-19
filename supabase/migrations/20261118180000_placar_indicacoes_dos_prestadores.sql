-- Placar de indicações de vários prestadores de uma vez (tag "X de Y não indicam" no card da busca).
-- Mesma conta do perfil público: só avaliações visíveis; indica = true / false. Devolve apenas contagens.
create or replace function public.placar_indicacoes_dos_prestadores(p_prestador_ids bigint[])
returns table (prestador_id bigint, indicam integer, nao_indicam integer)
language sql
stable
security definer
set search_path = ''
as $$
  select a.prestador_id,
         count(*) filter (where a.indica)::integer,
         count(*) filter (where not a.indica)::integer
    from public.avaliacoes a
   where a.prestador_id = any (p_prestador_ids)
     and a.visivel
   group by a.prestador_id;
$$;
revoke all on function public.placar_indicacoes_dos_prestadores(bigint[]) from public;
grant execute on function public.placar_indicacoes_dos_prestadores(bigint[]) to anon, authenticated;
