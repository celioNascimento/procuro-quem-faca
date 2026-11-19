-- Resumo de tráfego para o admin separar o que é gente de verdade do que é equipe, teste ou varredura.
-- Só leitura, só admin. Não guarda nada novo: usa logs_atividades e visitas_perfil que já existem.
--
--  buscas            BUSCA_REALIZADA: total, da equipe (contas admin), de logados e anônimas
--  visitas_via_busca VISITA_PERFIL_VIA_BUSCA: total, da equipe, anônimas, perfis distintos visitados por anônimos
--  dias_suspeitos    dias com 20+ visitas anônimas em que quase cada visita foi a um perfil diferente
--                    (padrão de robô percorrendo a lista, não de cliente procurando um serviço)
--  visitas_perfil    tabela de visitas gravada pelo servidor (com filtro de robô): com e sem sessão.
--                    Sem sessão = gravação antiga, feita direto pelo navegador, sem filtro.
create or replace function public.admin_trafego_resumo(p_dias integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_dias integer := greatest(1, least(coalesce(p_dias, 30), 365));
  v_ini  timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_dias, 30), 365)));
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'dias', v_dias,
    'buscas', jsonb_build_object(
      'total',   (select count(*) from public.logs_atividades where acao = 'BUSCA_REALIZADA' and created_at >= v_ini),
      'equipe',  (select count(*) from public.logs_atividades l where l.acao = 'BUSCA_REALIZADA' and l.created_at >= v_ini
                    and l.usuario_id in (select a.user_id from public.perfis_admin a)),
      'logados', (select count(*) from public.logs_atividades l where l.acao = 'BUSCA_REALIZADA' and l.created_at >= v_ini
                    and l.usuario_id is not null and l.usuario_id not in (select a.user_id from public.perfis_admin a)),
      'anonimas',(select count(*) from public.logs_atividades where acao = 'BUSCA_REALIZADA' and created_at >= v_ini and usuario_id is null)
    ),
    'visitas_via_busca', jsonb_build_object(
      'total',    (select count(*) from public.logs_atividades where acao = 'VISITA_PERFIL_VIA_BUSCA' and created_at >= v_ini),
      'equipe',   (select count(*) from public.logs_atividades l where l.acao = 'VISITA_PERFIL_VIA_BUSCA' and l.created_at >= v_ini
                     and l.usuario_id in (select a.user_id from public.perfis_admin a)),
      'anonimas', (select count(*) from public.logs_atividades where acao = 'VISITA_PERFIL_VIA_BUSCA' and created_at >= v_ini and usuario_id is null),
      'perfis_distintos_anonimos', (select count(distinct entidade_id) from public.logs_atividades
                                      where acao = 'VISITA_PERFIL_VIA_BUSCA' and created_at >= v_ini and usuario_id is null)
    ),
    'dias_suspeitos', (
      select count(*) from (
        select created_at::date as dia, count(*) as n, count(distinct entidade_id) as perfis
          from public.logs_atividades
         where acao = 'VISITA_PERFIL_VIA_BUSCA' and created_at >= v_ini and usuario_id is null
         group by 1
      ) d where d.n >= 20 and d.perfis >= 0.9 * d.n
    ),
    'visitas_perfil', jsonb_build_object(
      'total',      (select count(*) from public.visitas_perfil where criado_em >= v_ini),
      'com_sessao', (select count(*) from public.visitas_perfil where criado_em >= v_ini and sessao_id is not null),
      'sem_sessao', (select count(*) from public.visitas_perfil where criado_em >= v_ini and sessao_id is null)
    )
  );
end;
$$;
revoke all on function public.admin_trafego_resumo(integer) from public, anon;
grant execute on function public.admin_trafego_resumo(integer) to authenticated;
