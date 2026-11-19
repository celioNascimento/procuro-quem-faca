-- 20261119160000_feed_marca_meu.sql
--
-- O feed passa a dizer, em cada trabalho, se ele é do usuário logado ('meu'). O app usa isso para nem mostrar
-- Seguir/Curtir no trabalho do próprio prestador (mesma ideia do meu_perfil de perfil_social).
-- Só acrescenta um campo no JSON: assinatura igual à de 20261119150000, então é create or replace (sem drop).
-- As travas do banco (proprio_perfil em seguir_prestador, proprio_projeto em alternar_curtida) continuam como rede de segurança.
-- Ordem de produção: depois de 20261119150000.

create or replace function public.feed_projetos(
  p_categoria_id uuid default null,
  p_cidade_id uuid default null,
  p_somente_seguidos boolean default false,
  p_limite integer default 12,
  p_pagina integer default 0,
  p_estado text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_limite int := least(greatest(coalesce(p_limite, 12), 1), 30); v_pag int := greatest(coalesce(p_pagina, 0), 0); r jsonb;
begin
  if p_somente_seguidos and v_uid is null then return '[]'::jsonb; end if;

  with elegiveis as (
    select p.id, p.prestador_id, p.titulo, p.descricao,
           coalesce(p.marcado_concluido_at, p.aceito_at, p.created_at) as quando
      from public.portfolio_projetos p
      join public.prestadores pr on pr.id = p.prestador_id
     where p.status = 'finalizado'
       and p.feed_aceito_em is not null
       and p.feed_revogado_em is null
       and p.feed_oculto = false
       and pr.status = 'ativo' and pr.bloqueado is not true and pr.exemplo is not true
       and (p_categoria_id is null or pr.categoria_id = p_categoria_id)
       and (p_cidade_id is null or pr.cidade_id = p_cidade_id)
       and (nullif(btrim(p_estado), '') is null or exists (select 1 from public.cidades ce where ce.id = pr.cidade_id and ce.estado_sigla = upper(btrim(p_estado))))
       and (not p_somente_seguidos or exists (select 1 from public.seguidores s where s.user_id = v_uid and s.prestador_id = p.prestador_id))
       and exists (select 1 from public.portfolio_fotos f where f.projeto_id = p.id and (f.contem_pessoas is not true or f.consentimento_terceiros_confirmado is true))
  ),
  rodizio as (
    select e.*, row_number() over (partition by e.prestador_id order by e.quando desc, e.id) as rodada from elegiveis e
  ),
  pagina as (
    select * from rodizio order by rodada, quando desc, id offset v_pag * v_limite limit v_limite
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'projeto_id', g.id,
      'titulo', g.titulo,
      'descricao', left(coalesce(g.descricao, ''), 280),
      'concluido_em', g.quando,
      'prestador', jsonb_build_object('id', pr.id, 'nome', pr.nome, 'slug', pr.slug, 'categoria', c.nome, 'cidade', ci.nome),
      'fotos', (select coalesce(jsonb_agg(x.url_foto), '[]'::jsonb) from (
                  select f.url_foto from public.portfolio_fotos f
                   where f.projeto_id = g.id and (f.contem_pessoas is not true or f.consentimento_terceiros_confirmado is true)
                   order by f.capa desc nulls last, f.ordem nulls last limit 5) x),
      'total_curtidas', (select count(*)::int from public.portfolio_curtidas k where k.projeto_id = g.id),
      'curtido_por_mim', v_uid is not null and exists (select 1 from public.portfolio_curtidas k where k.projeto_id = g.id and k.user_id = v_uid),
      'seguindo', v_uid is not null and exists (select 1 from public.seguidores s where s.user_id = v_uid and s.prestador_id = g.prestador_id),
      'meu', v_uid is not null and pr.user_id = v_uid
    ) order by g.rodada, g.quando desc, g.id), '[]'::jsonb)
    into r
    from pagina g
    join public.prestadores pr on pr.id = g.prestador_id
    left join public.categorias c on c.id = pr.categoria_id
    left join public.cidades ci on ci.id = pr.cidade_id;

  return r;
end; $function$;

revoke all on function public.feed_projetos(uuid, uuid, boolean, integer, integer, text) from public;
grant execute on function public.feed_projetos(uuid, uuid, boolean, integer, integer, text) to anon, authenticated, service_role;
