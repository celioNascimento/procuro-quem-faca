-- Registro de ações do admin ("Quem fez o quê").
-- Só inclusão: ninguém edita nem apaga uma linha (nem o admin, nem o service_role).
-- A gravação vem de gatilhos nas tabelas que as ações do admin já alteram, então as funções
-- existentes (bloquear, feed, verificações) não mudam. Só conta quando quem alterou é admin:
-- rotinas do sistema e ações de prestador não entram.

create table if not exists public.admin_acoes (
  id          bigint generated always as identity primary key,
  quando      timestamptz not null default now(),
  admin_id    uuid references auth.users(id) on delete set null,
  admin_email text,
  acao        text not null,
  alvo_tipo   text not null,          -- prestador | trabalho | admin
  alvo_id     text not null,
  alvo_nome   text,
  motivo      text,
  detalhes    jsonb not null default '{}'::jsonb
);

create index if not exists admin_acoes_quando_idx on public.admin_acoes (quando desc);

alter table public.admin_acoes enable row level security;
revoke all on table public.admin_acoes from anon, authenticated;
grant select on table public.admin_acoes to authenticated;
drop policy if exists "Admin le o registro" on public.admin_acoes;
create policy "Admin le o registro" on public.admin_acoes
  for select to authenticated using ((select public.is_admin()));

create or replace function public.admin_acoes_somente_inclusao()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  raise exception 'O registro de ações não pode ser alterado' using errcode = '42501';
end;
$function$;

drop trigger if exists admin_acoes_bloqueia_alteracao on public.admin_acoes;
create trigger admin_acoes_bloqueia_alteracao
  before update or delete on public.admin_acoes
  for each row execute function public.admin_acoes_somente_inclusao();

-- Grava uma linha, mas só se quem está logado é admin. Não é chamada pelo navegador.
create or replace function public.admin_registrar(
  p_acao text, p_alvo_tipo text, p_alvo_id text, p_alvo_nome text default null,
  p_motivo text default null, p_detalhes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null or not (select public.is_admin()) then
    return;
  end if;
  insert into public.admin_acoes (admin_id, admin_email, acao, alvo_tipo, alvo_id, alvo_nome, motivo, detalhes)
  values (
    auth.uid(),
    (select email from public.perfis_admin where user_id = auth.uid()),
    p_acao, p_alvo_tipo, p_alvo_id, p_alvo_nome, nullif(btrim(coalesce(p_motivo, '')), ''), coalesce(p_detalhes, '{}'::jsonb)
  );
end;
$function$;
revoke all on function public.admin_registrar(text, text, text, text, text, jsonb) from public, anon, authenticated;

-- Bloqueio e desbloqueio de prestador
create or replace function public.admin_acoes_gatilho_bloqueio()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare v_id bigint := coalesce(new.prestador_id, old.prestador_id); v_nome text;
begin
  select nome into v_nome from public.prestadores where id = v_id;
  if tg_op = 'DELETE' then
    if found then
      perform public.admin_registrar('desbloqueou_prestador', 'prestador', v_id::text, v_nome);
    end if;
  else
    perform public.admin_registrar('bloqueou_prestador', 'prestador', v_id::text, v_nome, new.motivo);
  end if;
  return null;
end;
$function$;
drop trigger if exists admin_acoes_bloqueio on public.prestador_bloqueio;
create trigger admin_acoes_bloqueio
  after insert or update or delete on public.prestador_bloqueio
  for each row execute function public.admin_acoes_gatilho_bloqueio();

-- Feed: remover e devolver
create or replace function public.admin_acoes_gatilho_feed()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare v_id uuid := coalesce(new.projeto_id, old.projeto_id); v_titulo text;
begin
  select titulo into v_titulo from public.portfolio_projetos where id = v_id;
  if tg_op = 'DELETE' then
    if found then
      perform public.admin_registrar('devolveu_ao_feed', 'trabalho', v_id::text, v_titulo);
    end if;
  else
    perform public.admin_registrar('removeu_do_feed', 'trabalho', v_id::text, v_titulo, new.motivo);
  end if;
  return null;
end;
$function$;
drop trigger if exists admin_acoes_feed on public.feed_moderacao;
create trigger admin_acoes_feed
  after insert or update or delete on public.feed_moderacao
  for each row execute function public.admin_acoes_gatilho_feed();

-- Verificações: só quando o admin aprova ou rejeita (aprovação automática do sistema não entra)
create or replace function public.admin_acoes_gatilho_verificacao()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare v_nome text;
begin
  if new.status in ('aprovada', 'rejeitada') and new.status is distinct from old.status then
    select nome into v_nome from public.prestadores where id = new.prestador_id;
    perform public.admin_registrar(
      case new.status when 'aprovada' then 'aprovou_verificacao' else 'rejeitou_verificacao' end,
      'prestador', new.prestador_id::text, v_nome, null, jsonb_build_object('tipo', new.tipo)
    );
  end if;
  return null;
end;
$function$;
drop trigger if exists admin_acoes_verificacao on public.prestador_verificacoes;
create trigger admin_acoes_verificacao
  after update on public.prestador_verificacoes
  for each row execute function public.admin_acoes_gatilho_verificacao();

-- Convites: mudança de situação (anotações não entram)
create or replace function public.admin_acoes_gatilho_convite()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare v_nome text; v_de text := case when tg_op = 'UPDATE' then old.status else 'nao_enviado' end;
begin
  if new.status is distinct from v_de then
    select nome into v_nome from public.prestadores where id = new.prestador_id;
    perform public.admin_registrar('mudou_status_convite', 'prestador', new.prestador_id::text, v_nome, null,
      jsonb_build_object('de', v_de, 'para', new.status));
  end if;
  return null;
end;
$function$;
drop trigger if exists admin_acoes_convite on public.prestador_ativacao;
create trigger admin_acoes_convite
  after insert or update on public.prestador_ativacao
  for each row execute function public.admin_acoes_gatilho_convite();
