-- 20261119170000_feed_salvar.sql
--
-- "Salvar" trabalho (marcador, como no Instagram). Só o próprio usuário vê o que salvou; o prestador não sabe
-- quem salvou nem quantos. Limite de 500 salvos por pessoa. Não salva o próprio trabalho.
--  1) tabela portfolio_salvos (RLS: cada um lê só os seus; escrita só pela função alternar_salvo);
--  2) alternar_salvo(projeto): salva/remove e devolve {salvo};
--  3) feed_projetos ganha p_somente_salvos (aba "Salvos", mais recente primeiro) e o campo salvo_por_mim.
--     A versão de 6 parâmetros (20261119160000) é removida para não ficar duas funções com o mesmo nome;
--  4) perfil_social devolve salvo_por_mim por trabalho (botão Salvar do modal do perfil);
--  5) exportar_meus_dados inclui os trabalhos salvos.
-- Ordem de produção: depois de 20261119160000.

create table if not exists public.portfolio_salvos (
  projeto_id uuid not null references public.portfolio_projetos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (projeto_id, user_id)
);
create index if not exists portfolio_salvos_usuario_idx on public.portfolio_salvos (user_id, created_at desc);

alter table public.portfolio_salvos enable row level security;
drop policy if exists portfolio_salvos_ver_os_proprios on public.portfolio_salvos;
create policy portfolio_salvos_ver_os_proprios on public.portfolio_salvos for select to authenticated using (user_id = auth.uid());
revoke all on public.portfolio_salvos from anon, authenticated;
grant select on public.portfolio_salvos to authenticated;

create or replace function public.alternar_salvo(p_projeto_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_status text; v_dono uuid; v_total int;
begin
  if v_uid is null then return jsonb_build_object('erro', 'nao_autenticado'); end if;
  select p.status, pr.user_id into v_status, v_dono
    from public.portfolio_projetos p join public.prestadores pr on pr.id = p.prestador_id
   where p.id = p_projeto_id;
  if not found or v_status not in ('em_execucao', 'finalizado') then return jsonb_build_object('erro', 'nao_encontrado'); end if;
  if v_dono is not distinct from v_uid then return jsonb_build_object('erro', 'proprio_projeto'); end if;

  if exists (select 1 from public.portfolio_salvos where projeto_id = p_projeto_id and user_id = v_uid) then
    delete from public.portfolio_salvos where projeto_id = p_projeto_id and user_id = v_uid;
    return jsonb_build_object('salvo', false);
  end if;

  select count(*) into v_total from public.portfolio_salvos where user_id = v_uid;
  if v_total >= 500 then return jsonb_build_object('erro', 'limite_salvos'); end if;
  insert into public.portfolio_salvos (projeto_id, user_id) values (p_projeto_id, v_uid) on conflict do nothing;
  return jsonb_build_object('salvo', true);
end; $function$;

revoke all on function public.alternar_salvo(uuid) from public, anon;
grant execute on function public.alternar_salvo(uuid) to authenticated, service_role;

drop function if exists public.feed_projetos(uuid, uuid, boolean, integer, integer, text);

create or replace function public.feed_projetos(
  p_categoria_id uuid default null,
  p_cidade_id uuid default null,
  p_somente_seguidos boolean default false,
  p_limite integer default 12,
  p_pagina integer default 0,
  p_estado text default null,
  p_somente_salvos boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_limite int := least(greatest(coalesce(p_limite, 12), 1), 30); v_pag int := greatest(coalesce(p_pagina, 0), 0); r jsonb;
begin
  if (p_somente_seguidos or p_somente_salvos) and v_uid is null then return '[]'::jsonb; end if;

  with elegiveis as (
    select p.id, p.prestador_id, p.titulo, p.descricao,
           coalesce(p.marcado_concluido_at, p.aceito_at, p.created_at) as quando,
           sv.created_at as salvo_em
      from public.portfolio_projetos p
      left join public.portfolio_salvos sv on sv.projeto_id = p.id and sv.user_id = v_uid
      join public.prestadores pr on pr.id = p.prestador_id
     where p.status = 'finalizado'
       and p.feed_aceito_em is not null
       and p.feed_revogado_em is null
       and p.feed_oculto = false
       and pr.status = 'ativo' and pr.bloqueado is not true and pr.exemplo is not true
       and (p_categoria_id is null or pr.categoria_id = p_categoria_id)
       and (p_cidade_id is null or pr.cidade_id = p_cidade_id)
       and (nullif(btrim(p_estado), '') is null or exists (select 1 from public.cidades ce where ce.id = pr.cidade_id and ce.estado_sigla = upper(btrim(p_estado))))
       and (not p_somente_salvos or sv.projeto_id is not null)
       and (not p_somente_seguidos or exists (select 1 from public.seguidores s where s.user_id = v_uid and s.prestador_id = p.prestador_id))
       and exists (select 1 from public.portfolio_fotos f where f.projeto_id = p.id and (f.contem_pessoas is not true or f.consentimento_terceiros_confirmado is true))
  ),
  rodizio as (
    select e.*, row_number() over (partition by e.prestador_id order by e.quando desc, e.id) as rodada from elegiveis e
  ),
  pagina as (
    select * from rodizio
     order by case when p_somente_salvos then 0 else rodada end,
              case when p_somente_salvos then salvo_em end desc nulls last, quando desc, id
    offset v_pag * v_limite limit v_limite
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
      'salvo_por_mim', g.salvo_em is not null,
      'meu', v_uid is not null and pr.user_id = v_uid
    ) order by case when p_somente_salvos then 0 else g.rodada end,
               case when p_somente_salvos then g.salvo_em end desc nulls last, g.quando desc, g.id), '[]'::jsonb)
    into r
    from pagina g
    join public.prestadores pr on pr.id = g.prestador_id
    left join public.categorias c on c.id = pr.categoria_id
    left join public.cidades ci on ci.id = pr.cidade_id;

  return r;
end; $function$;

revoke all on function public.feed_projetos(uuid, uuid, boolean, integer, integer, text, boolean) from public;
grant execute on function public.feed_projetos(uuid, uuid, boolean, integer, integer, text, boolean) to anon, authenticated, service_role;

create or replace function public.perfil_social(p_prestador_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid;
begin
  select user_id into v_dono from public.prestadores
   where id = p_prestador_id and status = 'ativo' and bloqueado is not true and exemplo is not true;
  if not found then return null; end if;

  return jsonb_build_object(
    'total_seguidores', (select count(*)::int from public.seguidores where prestador_id = p_prestador_id),
    'seguindo', v_uid is not null and exists (select 1 from public.seguidores s where s.user_id = v_uid and s.prestador_id = p_prestador_id),
    'meu_perfil', v_uid is not null and v_dono is not distinct from v_uid,
    'curtidas', coalesce((
      select jsonb_object_agg(p.id::text, jsonb_build_object(
        'total', (select count(*)::int from public.portfolio_curtidas k where k.projeto_id = p.id),
        'curtido_por_mim', v_uid is not null and exists (select 1 from public.portfolio_curtidas k where k.projeto_id = p.id and k.user_id = v_uid),
        'salvo_por_mim', v_uid is not null and exists (select 1 from public.portfolio_salvos sv where sv.projeto_id = p.id and sv.user_id = v_uid)))
        from public.portfolio_projetos p
       where p.prestador_id = p_prestador_id and p.status in ('em_execucao', 'finalizado')
    ), '{}'::jsonb)
  );
end; $function$;

revoke all on function public.perfil_social(bigint) from public;
grant execute on function public.perfil_social(bigint) to anon, authenticated, service_role;

create or replace function public.exportar_meus_dados()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_prestador_id bigint;
begin
  if v_uid is null then
    raise exception 'Faça login para exportar seus dados' using errcode = '28000';
  end if;

  select id into v_prestador_id from public.prestadores where user_id = v_uid;

  return jsonb_build_object(
    'gerado_em', now(),
    'versao_formato', 1,
    'conta', (select jsonb_build_object('id', u.id, 'email', u.email, 'criada_em', u.created_at, 'ultimo_acesso', u.last_sign_in_at)
                from auth.users u where u.id = v_uid),
    'perfil', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'perfil_antigo', (select to_jsonb(p) from public.perfis p where p.id = v_uid),
    'prestador', (select to_jsonb(p) from public.prestadores p where p.user_id = v_uid),
    'anunciante', (select to_jsonb(a) from public.anunciantes a where a.user_id = v_uid),

    'projetos_como_prestador', coalesce((
      select jsonb_agg(jsonb_build_object('id', pp.id, 'titulo', pp.titulo, 'descricao', pp.descricao, 'status', pp.status,
                                          'data_inicio', pp.data_inicio, 'data_conclusao', pp.data_conclusao, 'criado_em', pp.created_at)
                       order by pp.created_at)
        from public.portfolio_projetos pp where pp.prestador_id = v_prestador_id), '[]'::jsonb),
    'fotos_do_portfolio', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'projeto_id', f.projeto_id, 'url', f.url_foto, 'legenda', f.legenda,
                                          'contem_pessoas', f.contem_pessoas, 'capa', f.capa) order by f.id)
        from public.portfolio_fotos f where f.prestador_id = v_prestador_id), '[]'::jsonb),
    'orcamentos_como_prestador', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'titulo', o.titulo, 'status', o.status, 'valor_total', o.valor_total,
                                          'validade', o.validade, 'criado_em', o.created_at) order by o.created_at)
        from public.orcamentos o where o.prestador_id = v_prestador_id), '[]'::jsonb),
    'avaliacoes_recebidas', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'nota', a.nota, 'comentario', a.comentario,
                                          'resposta_prestador', a.resposta_prestador, 'criado_em', a.created_at) order by a.created_at)
        from public.avaliacoes a where a.prestador_id = v_prestador_id), '[]'::jsonb),
    'garantias_como_prestador', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'status', g.status, 'tipo', g.tipo, 'criado_em', g.created_at) order by g.created_at)
        from public.solicitacoes_garantia g where g.prestador_id = v_prestador_id), '[]'::jsonb),

    'projetos_como_cliente', coalesce((
      select jsonb_agg(jsonb_build_object('id', pp.id, 'prestador_id', pp.prestador_id, 'titulo', pp.titulo, 'descricao', pp.descricao,
                                          'status', pp.status, 'data_conclusao', pp.data_conclusao, 'criado_em', pp.created_at)
                       order by pp.created_at)
        from public.portfolio_projetos pp where pp.cliente_user_id = v_uid), '[]'::jsonb),
    'avaliacoes_feitas', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at) from public.avaliacoes a where a.cliente_id = v_uid), '[]'::jsonb),
    'avaliacoes_sobre_mim_como_cliente', coalesce((
      select jsonb_agg(jsonb_build_object('id', ac.id, 'nota', ac.nota, 'motivos', ac.motivos, 'criado_em', ac.created_at)
                       order by ac.created_at)
        from public.avaliacoes_clientes ac where ac.cliente_user_id = v_uid), '[]'::jsonb),
    'garantias_como_cliente', coalesce((
      select jsonb_agg(to_jsonb(g) order by g.created_at) from public.solicitacoes_garantia g where g.cliente_user_id = v_uid), '[]'::jsonb),
    'orcamentos_como_cliente', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'prestador_id', o.prestador_id, 'titulo', o.titulo, 'status', o.status,
                                          'valor_total', o.valor_total, 'cliente_nome', o.cliente_nome,
                                          'cliente_whatsapp', o.cliente_whatsapp, 'criado_em', o.created_at) order by o.created_at)
        from public.orcamentos o where o.cliente_id = v_uid), '[]'::jsonb),
    'curtidas', coalesce((
      select jsonb_agg(jsonb_build_object('projeto_id', c.projeto_id, 'criado_em', c.created_at) order by c.created_at)
        from public.portfolio_curtidas c where c.user_id = v_uid), '[]'::jsonb),

    'prestadores_que_sigo', coalesce((
      select jsonb_agg(jsonb_build_object('prestador_id', s.prestador_id, 'nome', p.nome, 'seguindo_desde', s.created_at)
                       order by s.created_at)
        from public.seguidores s join public.prestadores p on p.id = s.prestador_id
       where s.user_id = v_uid), '[]'::jsonb),

    'trabalhos_salvos', coalesce((
      select jsonb_agg(jsonb_build_object('projeto_id', sv.projeto_id, 'salvo_em', sv.created_at) order by sv.created_at)
        from public.portfolio_salvos sv where sv.user_id = v_uid), '[]'::jsonb),

    'consentimentos', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', c.tipo, 'versao_documento', c.versao_documento, 'concedido', c.concedido,
                                          'origem', c.origem, 'aceito_em', c.aceito_em) order by c.aceito_em desc)
        from public.consentimentos c where c.user_id = v_uid), '[]'::jsonb),
    'pedidos_titular', coalesce((
      select jsonb_agg(jsonb_build_object('protocolo', upper(left(s.id::text, 8)), 'tipo', s.tipo, 'status', s.status,
                                          'prazo_resposta', s.prazo_resposta, 'resposta', s.resposta,
                                          'respondido_em', s.respondido_em, 'criado_em', s.created_at) order by s.created_at desc)
        from public.solicitacoes_titular s where s.user_id = v_uid), '[]'::jsonb),
    'registros_de_atividade', coalesce((
      select jsonb_agg(jsonb_build_object('acao', l.acao, 'entidade_tipo', l.entidade_tipo, 'entidade_id', l.entidade_id,
                                          'quando', coalesce(l.created_at, l.criado_em)) order by coalesce(l.created_at, l.criado_em) desc)
        from (select * from public.logs_atividades where usuario_id = v_uid
               order by coalesce(created_at, criado_em) desc limit 1000) l), '[]'::jsonb)
  );
end;
$function$;
revoke all on function public.exportar_meus_dados() from public, anon;
grant execute on function public.exportar_meus_dados() to authenticated, service_role;
