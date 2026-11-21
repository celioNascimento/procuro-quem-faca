-- Desbloquear não pode aprovar ninguém: o bloqueio só marca `bloqueado = true` e não muda o status,
-- então o desbloqueio também não deve forçar 'ativo' (um prestador 'pendente' pularia o fim do cadastro).
-- Só o valor antigo 'bloqueado' (legado) volta para 'ativo'.
create or replace function public.admin_desbloquear_prestador(p_prestador_id bigint)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;

  update public.prestadores
     set bloqueado = false,
         status = case when status = 'bloqueado' then 'ativo' else status end
   where id = p_prestador_id;
  if not found then
    raise exception 'Prestador não encontrado' using errcode = 'P0002';
  end if;

  delete from public.prestador_bloqueio where prestador_id = p_prestador_id;
end;
$function$;
revoke all on function public.admin_desbloquear_prestador(bigint) from public, anon;
grant execute on function public.admin_desbloquear_prestador(bigint) to authenticated, service_role;
