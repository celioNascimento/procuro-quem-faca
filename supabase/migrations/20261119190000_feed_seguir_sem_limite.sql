-- 20261119190000_feed_seguir_sem_limite.sql
-- Tira o limite de 500 perfis seguidos por conta (decisão do dono, 19/11): numa cidade grande, 500 é pouco.
-- Mesma assinatura de 20261119100000, então é create or replace (sem drop). Só some o bloco 'limite_atingido'.
-- Ordem de produção: depois de 20261119100000.
create or replace function public.seguir_prestador(p_prestador_id bigint)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_dono uuid;
begin
  if v_uid is null then return 'nao_autenticado'; end if;
  select user_id into v_dono from public.prestadores
   where id = p_prestador_id and status = 'ativo' and bloqueado is not true and exemplo is not true;
  if not found then return 'nao_encontrado'; end if;
  if v_dono is not distinct from v_uid then return 'proprio_perfil'; end if;
  insert into public.seguidores (user_id, prestador_id) values (v_uid, p_prestador_id) on conflict do nothing;
  return 'ok';
end; $function$;
