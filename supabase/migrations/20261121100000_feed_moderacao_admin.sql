-- Feed no admin: ver os trabalhos aceitos, o total por dia e remover um trabalho por conteúdo indevido.
--
-- Remover = marcar feed_revogado_em (o mesmo campo que o cliente usa para retirar). Todas as listas do
-- feed já ignoram trabalho revogado, e `aceitar_projeto` só aceita trabalho pendente, então ninguém
-- (nem cliente, nem prestador) consegue recolocar. Só o admin devolve, por `admin_devolver_ao_feed`.
-- O motivo e quem removeu ficam em `feed_moderacao`, tabela que só administradores leem.
-- Não muda nenhuma função existente do feed.

create table if not exists public.feed_moderacao (
  projeto_id uuid primary key references public.portfolio_projetos(id) on delete cascade,
  motivo text not null,
  removido_em timestamptz not null default now(),
  removido_por uuid references auth.users(id) on delete set null
);

alter table public.feed_moderacao enable row level security;
revoke all on public.feed_moderacao from public, anon, authenticated;
grant select on public.feed_moderacao to authenticated;

drop policy if exists feed_moderacao_admin_le on public.feed_moderacao;
create policy feed_moderacao_admin_le on public.feed_moderacao
  for select to authenticated using ((select public.is_admin()));

-- Remove o trabalho do feed. Motivo obrigatório.
create or replace function public.admin_remover_do_feed(p_projeto_id uuid, p_motivo text)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare v_motivo text := nullif(btrim(p_motivo), '');
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  if v_motivo is null then return 'motivo_obrigatorio'; end if;
  if not exists (select 1 from public.portfolio_projetos where id = p_projeto_id and feed_aceito_em is not null) then
    return 'nao_esta_no_feed';
  end if;

  update public.portfolio_projetos
     set feed_revogado_em = coalesce(feed_revogado_em, now())
   where id = p_projeto_id;

  insert into public.feed_moderacao (projeto_id, motivo, removido_por)
  values (p_projeto_id, v_motivo, auth.uid())
  on conflict (projeto_id) do update set motivo = excluded.motivo, removido_em = now(), removido_por = excluded.removido_por;
  return 'ok';
end;
$function$;
revoke all on function public.admin_remover_do_feed(uuid, text) from public, anon;
grant execute on function public.admin_remover_do_feed(uuid, text) to authenticated, service_role;

-- Devolve ao feed só o que o admin removeu. Retirada feita pelo cliente continua valendo.
create or replace function public.admin_devolver_ao_feed(p_projeto_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  if not exists (select 1 from public.feed_moderacao where projeto_id = p_projeto_id) then
    return 'nao_foi_removido_pelo_admin';
  end if;

  update public.portfolio_projetos set feed_revogado_em = null where id = p_projeto_id;
  delete from public.feed_moderacao where projeto_id = p_projeto_id;
  return 'ok';
end;
$function$;
revoke all on function public.admin_devolver_ao_feed(uuid) from public, anon;
grant execute on function public.admin_devolver_ao_feed(uuid) to authenticated, service_role;

-- Resumo do feed para a tela do admin: os 100 trabalhos aceitos mais recentes e o total por dia.
-- Lê só campos que o admin precisa (nada de WhatsApp, nome ou token do cliente).
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
      select (feed_aceito_em at time zone 'America/Sao_Paulo')::date as dia, count(*) as total
        from public.portfolio_projetos
       where feed_aceito_em is not null
       group by 1
    ) q on q.dia = d.dia;

  return jsonb_build_object('itens', v_itens, 'por_dia', v_por_dia);
end;
$function$;
revoke all on function public.admin_feed_resumo(integer) from public, anon;
grant execute on function public.admin_feed_resumo(integer) to authenticated, service_role;
