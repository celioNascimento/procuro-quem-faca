-- JÁ APLICADO NO BANCO em 11/11/2026 (arquivo para versionar). Idempotente.
-- Campos internos saem da tabela pública `prestadores`. Ela é legível por qualquer visitante (regras de leitura
-- abertas e `select *` no app), então funil de ativação, observações e motivo de bloqueio ficam em tabelas
-- próprias, com acesso só do administrador (e, no bloqueio, do próprio prestador para ler o seu motivo).
-- Esta migration só ACRESCENTA. As colunas antigas saem em 20261111150000, depois do deploy do app.

create table if not exists public.prestador_ativacao (
  prestador_id bigint primary key references public.prestadores(id) on delete cascade,
  status text not null default 'nao_enviado'
    check (status in ('nao_enviado','enviado','respondeu_positivo','respondeu_negativo','sem_whatsapp','perfil_completo','avaliacao_recebida')),
  enviado_em timestamptz,
  respondeu_em timestamptz,
  obs text,
  atualizado_em timestamptz not null default now()
);
alter table public.prestador_ativacao enable row level security;
revoke all on table public.prestador_ativacao from anon;
drop policy if exists "Admin gerencia ativação" on public.prestador_ativacao;
create policy "Admin gerencia ativação" on public.prestador_ativacao
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.prestador_bloqueio (
  prestador_id bigint primary key references public.prestadores(id) on delete cascade,
  motivo text not null,
  atualizado_em timestamptz not null default now()
);
alter table public.prestador_bloqueio enable row level security;
revoke all on table public.prestador_bloqueio from anon;
drop policy if exists "Admin gerencia bloqueio" on public.prestador_bloqueio;
create policy "Admin gerencia bloqueio" on public.prestador_bloqueio
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Dono lê o motivo do próprio bloqueio" on public.prestador_bloqueio;
create policy "Dono lê o motivo do próprio bloqueio" on public.prestador_bloqueio
  for select to authenticated
  using (exists (select 1 from public.prestadores p where p.id = prestador_id and p.user_id = (select auth.uid())));

-- Cópia dos dados atuais
insert into public.prestador_ativacao (prestador_id, status, enviado_em, respondeu_em, obs)
select id, coalesce(ativacao_status, 'nao_enviado'), ativacao_enviado_em, ativacao_respondeu_em, nullif(btrim(ativacao_obs), '')
  from public.prestadores
on conflict (prestador_id) do nothing;

insert into public.prestador_bloqueio (prestador_id, motivo)
select id, btrim(motivo_bloqueio) from public.prestadores where coalesce(btrim(motivo_bloqueio), '') <> ''
on conflict (prestador_id) do nothing;

-- O prestador, ao completar o perfil, avança o próprio funil (só de "não enviado" para "perfil completo")
create or replace function public.ativacao_marcar_perfil_completo()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_id bigint;
begin
  select id into v_id from public.prestadores where user_id = (select auth.uid());
  if v_id is null then
    return;
  end if;

  insert into public.prestador_ativacao (prestador_id, status) values (v_id, 'perfil_completo')
  on conflict (prestador_id) do update
     set status = 'perfil_completo', atualizado_em = now()
   where public.prestador_ativacao.status = 'nao_enviado';
end;
$function$;
revoke all on function public.ativacao_marcar_perfil_completo() from public, anon;
grant execute on function public.ativacao_marcar_perfil_completo() to authenticated, service_role;

-- Bloqueio e desbloqueio atômicos, só para administradores
create or replace function public.admin_bloquear_prestador(p_prestador_id bigint, p_motivo text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;

  update public.prestadores set bloqueado = true where id = p_prestador_id;
  if not found then
    raise exception 'Prestador não encontrado' using errcode = 'P0002';
  end if;

  insert into public.prestador_bloqueio (prestador_id, motivo)
  values (p_prestador_id, coalesce(nullif(btrim(p_motivo), ''), 'Sem motivo informado'))
  on conflict (prestador_id) do update set motivo = excluded.motivo, atualizado_em = now();
end;
$function$;
revoke all on function public.admin_bloquear_prestador(bigint, text) from public, anon;
grant execute on function public.admin_bloquear_prestador(bigint, text) to authenticated, service_role;

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

  update public.prestadores set bloqueado = false, status = 'ativo' where id = p_prestador_id;
  if not found then
    raise exception 'Prestador não encontrado' using errcode = 'P0002';
  end if;

  delete from public.prestador_bloqueio where prestador_id = p_prestador_id;
end;
$function$;
revoke all on function public.admin_desbloquear_prestador(bigint) from public, anon;
grant execute on function public.admin_desbloquear_prestador(bigint) to authenticated, service_role;
