-- 20261119130000_feed_cidades.sql
--
-- Filtro por cidade do feed: só as cidades que TÊM trabalho aparecendo no feed (nunca cai em tela vazia).
-- Usa a mesma regra de elegibilidade de feed_projetos. Público (o feed é público). Só id, nome e UF.

create or replace function public.feed_cidades()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'nome', c.nome, 'estado_sigla', c.estado_sigla) order by c.nome), '[]'::jsonb)
    from public.cidades c
   where exists (
     select 1
       from public.portfolio_projetos p
       join public.prestadores pr on pr.id = p.prestador_id
      where pr.cidade_id = c.id
        and p.status = 'finalizado'
        and p.feed_aceito_em is not null
        and p.feed_revogado_em is null
        and p.feed_oculto = false
        and pr.status = 'ativo' and pr.bloqueado is not true and pr.exemplo is not true
        and exists (select 1 from public.portfolio_fotos f
                     where f.projeto_id = p.id and (f.contem_pessoas is not true or f.consentimento_terceiros_confirmado is true))
   );
$function$;

revoke all on function public.feed_cidades() from public;
grant execute on function public.feed_cidades() to anon, authenticated, service_role;
