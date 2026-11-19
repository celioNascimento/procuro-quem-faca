-- 20261119120000_perfil_social.sql
--
-- Curtir e seguir no PERFIL PÚBLICO do prestador (e no modal do trabalho).
-- Uma chamada devolve o que a tela precisa: total de seguidores (só o número), se quem olha já segue,
-- se o perfil é dele mesmo e, por trabalho, o total de curtidas e se quem olha curtiu.
-- Público (anônimo vê os totais; "seguindo" e "curtido_por_mim" só valem para quem está logado).
-- Perfil inativo, bloqueado ou de exemplo devolve null: a tela não mostra curtir/seguir.
-- Nunca devolve quem segue nem quem curtiu.

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
        'curtido_por_mim', v_uid is not null and exists (select 1 from public.portfolio_curtidas k where k.projeto_id = p.id and k.user_id = v_uid)))
        from public.portfolio_projetos p
       where p.prestador_id = p_prestador_id and p.status in ('em_execucao', 'finalizado')
    ), '{}'::jsonb)
  );
end; $function$;

revoke all on function public.perfil_social(bigint) from public;
grant execute on function public.perfil_social(bigint) to anon, authenticated, service_role;
