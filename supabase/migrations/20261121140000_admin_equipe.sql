-- Gestão da equipe de admins pela tela (sem SQL): listar, adicionar e remover.
-- Só o dono (role 'owner') adiciona e remove. Remover tira o acesso ao painel; não derruba a sessão aberta.
-- Cada mudança entra no registro de ações (admin_acoes) por gatilho em perfis_admin.

create or replace function public.admin_e_dono()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select (select public.is_admin())
     and exists (select 1 from public.perfis_admin where user_id = (select auth.uid()) and role = 'owner');
$function$;
revoke all on function public.admin_e_dono() from public, anon;
grant execute on function public.admin_e_dono() to authenticated;

-- Lista a equipe. Qualquer admin vê; só o dono vê os botões de adicionar e remover.
create or replace function public.admin_equipe()
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
  return jsonb_build_object(
    'eu_dono', (select public.admin_e_dono()),
    'meu_id', auth.uid(),
    'membros', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id,
        'email', p.email,
        'role', p.role,
        'desde', p.created_at,
        'ultimo_acesso', u.last_sign_in_at,
        'duas_etapas', exists (select 1 from auth.mfa_factors f where f.user_id = p.user_id and f.status = 'verified')
      ) order by p.created_at, p.email)
      from public.perfis_admin p
      left join auth.users u on u.id = p.user_id
    ), '[]'::jsonb)
  );
end;
$function$;
revoke all on function public.admin_equipe() from public, anon;
grant execute on function public.admin_equipe() to authenticated;

-- Adiciona alguém que já tem conta no site, como editor. Devolve um código simples.
create or replace function public.admin_equipe_adicionar(p_email text)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare v_email text := lower(btrim(coalesce(p_email, ''))); v_id uuid;
begin
  if not (select public.admin_e_dono()) then return 'sem_permissao'; end if;
  if v_email = '' or position('@' in v_email) = 0 then return 'email_invalido'; end if;
  select id into v_id from auth.users where lower(email) = v_email limit 1;
  if v_id is null then return 'sem_conta'; end if;
  if exists (select 1 from public.perfis_admin where user_id = v_id) then return 'ja_e_admin'; end if;
  insert into public.perfis_admin (user_id, email, role) values (v_id, v_email, 'editor');
  return 'ok';
end;
$function$;
revoke all on function public.admin_equipe_adicionar(text) from public, anon;
grant execute on function public.admin_equipe_adicionar(text) to authenticated;

-- Remove da equipe. Não deixa remover a si mesmo nem o último dono.
create or replace function public.admin_equipe_remover(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare v_role text;
begin
  if not (select public.admin_e_dono()) then return 'sem_permissao'; end if;
  if p_user_id = auth.uid() then return 'nao_pode_remover_a_si'; end if;
  select role into v_role from public.perfis_admin where user_id = p_user_id;
  if not found then return 'nao_encontrado'; end if;
  if v_role = 'owner' and (select count(*) from public.perfis_admin where role = 'owner') <= 1 then
    return 'ultimo_dono';
  end if;
  delete from public.perfis_admin where user_id = p_user_id;
  return 'ok';
end;
$function$;
revoke all on function public.admin_equipe_remover(uuid) from public, anon;
grant execute on function public.admin_equipe_remover(uuid) to authenticated;

-- Registro de ações: entrada e saída da equipe
create or replace function public.admin_acoes_gatilho_equipe()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if tg_op = 'INSERT' then
    perform public.admin_registrar('adicionou_admin', 'admin', new.user_id::text, new.email, null, jsonb_build_object('role', new.role));
  else
    perform public.admin_registrar('removeu_admin', 'admin', old.user_id::text, old.email, null, jsonb_build_object('role', old.role));
  end if;
  return null;
end;
$function$;
drop trigger if exists admin_acoes_equipe on public.perfis_admin;
create trigger admin_acoes_equipe
  after insert or delete on public.perfis_admin
  for each row execute function public.admin_acoes_gatilho_equipe();
