-- JÁ APLICADO NO BANCO em 11/11/2026 (arquivo para versionar). Idempotente.
-- Exportação dos dados da própria pessoa (acesso e portabilidade). O usuário não informa o id: a função usa
-- sempre auth.uid(). Dados de terceiros (nome e WhatsApp dos clientes do prestador, quem avaliou, tokens)
-- ficam de fora das seções do lado do prestador.
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
