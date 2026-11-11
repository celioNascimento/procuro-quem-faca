-- JÁ APLICADO NO BANCO em 10/11/2026 (arquivo para versionar). Idempotente.
-- 1) Tipo "outro" no pedido do titular; 2) contagem das pendências do admin.

alter table public.solicitacoes_titular drop constraint if exists solicitacoes_titular_tipo_check;
alter table public.solicitacoes_titular add constraint solicitacoes_titular_tipo_check
  check (tipo = any (array['acesso','correcao','exclusao','portabilidade','revogacao','oposicao','outro']));

create or replace function public.registrar_solicitacao_titular(
  p_tipo text, p_nome text, p_contato text,
  p_descricao text default null, p_prestador_id bigint default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_contato text := btrim(coalesce(p_contato, ''));
  v_recentes integer;
  v_id uuid;
begin
  if p_tipo is null or p_tipo not in (
    'acesso', 'correcao', 'exclusao', 'portabilidade', 'revogacao', 'oposicao', 'outro'
  ) then
    raise exception 'Tipo de solicitação inválido' using errcode = '22023';
  end if;

  if length(v_contato) < 5 or length(v_contato) > 200 then
    raise exception 'Informe um contato válido' using errcode = '22023';
  end if;

  if length(coalesce(p_nome, '')) > 200 or length(coalesce(p_descricao, '')) > 2000 then
    raise exception 'Texto muito longo' using errcode = '22023';
  end if;

  select count(*) into v_recentes
  from public.solicitacoes_titular
  where contato = v_contato
    and created_at > now() - interval '1 hour';

  if v_recentes >= 3 then
    raise exception 'Muitas solicitações. Tente novamente mais tarde.' using errcode = '54000';
  end if;

  insert into public.solicitacoes_titular (user_id, prestador_id, tipo, nome_solicitante, contato, descricao)
  values ((select auth.uid()), p_prestador_id, p_tipo, nullif(btrim(p_nome), ''), v_contato, nullif(btrim(p_descricao), ''))
  returning id into v_id;

  return v_id;
end;
$function$;

revoke all on function public.registrar_solicitacao_titular(text, text, text, text, bigint) from public;
grant execute on function public.registrar_solicitacao_titular(text, text, text, text, bigint) to anon, authenticated, service_role;

-- Contagem interna (servidor e função do painel)
create or replace function public.contar_pendencias()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'titular_abertas',
      (select count(*) from public.solicitacoes_titular where status in ('recebida', 'em_analise')),
    'titular_atrasadas',
      (select count(*) from public.solicitacoes_titular
        where status in ('recebida', 'em_analise') and prazo_resposta < current_date),
    'denuncias_abertas',
      (select count(*) from public.denuncias where status = 'aberta'),
    'garantias_abertas',
      (select count(*) from public.solicitacoes_garantia where status in ('aberta', 'sem_resposta')),
    'contestacoes_abertas',
      (select count(*) from public.contestacoes where status = 'aberto')
  );
$function$;
revoke all on function public.contar_pendencias() from public, anon, authenticated;
grant execute on function public.contar_pendencias() to service_role;

-- Versão do painel: só administradores (contador do menu)
create or replace function public.admin_pendencias()
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
  return public.contar_pendencias();
end;
$function$;
revoke all on function public.admin_pendencias() from public, anon;
grant execute on function public.admin_pendencias() to authenticated, service_role;
