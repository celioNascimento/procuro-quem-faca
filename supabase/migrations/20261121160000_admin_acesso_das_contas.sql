-- Quando cada conta de prestador foi criada e quando entrou pela última vez, só para o admin.
-- O admin não lê auth.users, e `prestadores.created_at` engana: quem reivindicou um perfil de curadoria
-- tem o perfil criado meses antes da conta. Serve ao card "Precisa de ajuda" (quem sumiu).
create or replace function public.admin_acesso_das_contas()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'prestador_id', p.id,
      'conta_criada', u.created_at,
      'ultimo_acesso', u.last_sign_in_at
    ))
    from public.prestadores p
    join auth.users u on u.id = p.user_id
    where p.exemplo is not true
  ), '[]'::jsonb);
end;
$function$;
revoke all on function public.admin_acesso_das_contas() from public, anon;
grant execute on function public.admin_acesso_das_contas() to authenticated;
