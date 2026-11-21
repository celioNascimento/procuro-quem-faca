-- Feed no admin: perfis de exemplo (prestadores.exemplo = true) são demonstração, não trabalho real.
-- Cada item passa a trazer `exemplo`, e o total por dia ignora os de exemplo.
-- Só troca a função admin_feed_resumo; o formato antigo continua valendo (campo novo é extra).

create or replace function public.admin_feed_resumo(p_dias integer default 14)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare v_dias integer := least(greatest(coalesce(p_dias, 14), 1), 90);
        v_itens jsonb; v_por_dia jsonb;
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(x order by (x->>'aceito_em') desc), '[]'::jsonb) into v_itens
    from (
      select jsonb_build_object(
        'projeto_id', p.id,
        'titulo', p.titulo,
        'prestador_id', pr.id,
        'prestador_nome', pr.nome,
        'prestador_slug', pr.slug,
        'cidade', c.nome,
        'aceito_em', p.feed_aceito_em,
        'exemplo', coalesce(pr.exemplo, false),
        'total_fotos', (select count(*) from public.portfolio_fotos f where f.projeto_id = p.id),
        'motivo_remocao', m.motivo,
        'situacao', case
          when m.projeto_id is not null then 'removido_admin'
          when p.feed_revogado_em is not null then 'retirado_cliente'
          when p.feed_oculto then 'oculto_prestador'
          when p.status <> 'finalizado' then 'aguardando_conclusao'
          else 'no_ar' end
      ) as x
        from public.portfolio_projetos p
        join public.prestadores pr on pr.id = p.prestador_id
        left join public.cidades c on c.id = pr.cidade_id
        left join public.feed_moderacao m on m.projeto_id = p.id
       where p.feed_aceito_em is not null
       order by p.feed_aceito_em desc
       limit 100
    ) t;

  select coalesce(jsonb_agg(jsonb_build_object('dia', d.dia, 'total', coalesce(q.total, 0)) order by d.dia), '[]'::jsonb) into v_por_dia
    from (
      select (now() at time zone 'America/Sao_Paulo')::date - g as dia
        from generate_series(0, v_dias - 1) g
    ) d
    left join (
      select (p.feed_aceito_em at time zone 'America/Sao_Paulo')::date as dia, count(*) as total
        from public.portfolio_projetos p
        join public.prestadores pr on pr.id = p.prestador_id
       where p.feed_aceito_em is not null
         and pr.exemplo is not true
       group by 1
    ) q on q.dia = d.dia;

  return jsonb_build_object('itens', v_itens, 'por_dia', v_por_dia);
end;
$function$;
revoke all on function public.admin_feed_resumo(integer) from public, anon;
grant execute on function public.admin_feed_resumo(integer) to authenticated, service_role;
