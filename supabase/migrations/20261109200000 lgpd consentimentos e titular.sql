-- Versiona o que já estava aplicado no banco (idempotente): consentimentos, solicitações do titular,
-- campos de consentimento de terceiros em portfolio_fotos e funções de apoio.
-- Seguro para rodar de novo: usa IF NOT EXISTS / CREATE OR REPLACE.

-- 1) consentimentos --------------------------------------------------------------
create table if not exists public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  prestador_id bigint references public.prestadores(id) on delete set null,
  tipo text not null,
  versao_documento text not null,
  concedido boolean not null default true,
  origem text not null,
  aceito_em timestamptz not null default now(),
  constraint consentimentos_tipo_check check (tipo = any (array['termos_uso','politica_privacidade','termo_fotos_terceiros','comunicacao_whatsapp'])),
  constraint consentimentos_origem_check check (origem = any (array['cadastro_prestador','cadastro_cliente','upload_foto','painel','outro']))
);

create index if not exists consentimentos_user_tipo_idx
  on public.consentimentos (user_id, tipo, aceito_em desc);

alter table public.consentimentos enable row level security;

drop policy if exists consentimentos_insere_proprio on public.consentimentos;
create policy consentimentos_insere_proprio on public.consentimentos
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists consentimentos_le_proprio_ou_admin on public.consentimentos;
create policy consentimentos_le_proprio_ou_admin on public.consentimentos
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- 2) solicitacoes_titular --------------------------------------------------------
create table if not exists public.solicitacoes_titular (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  prestador_id bigint references public.prestadores(id) on delete set null,
  tipo text not null,
  nome_solicitante text,
  contato text not null,
  descricao text,
  status text not null default 'recebida',
  prazo_resposta date not null default (current_date + 15),
  resposta text,
  respondido_em timestamptz,
  atendido_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint solicitacoes_titular_tipo_check check (tipo = any (array['acesso','correcao','exclusao','portabilidade','revogacao','oposicao'])),
  constraint solicitacoes_titular_status_check check (status = any (array['recebida','em_analise','atendida','negada']))
);

create index if not exists solicitacoes_titular_status_prazo_idx
  on public.solicitacoes_titular (status, prazo_resposta);
create index if not exists solicitacoes_titular_contato_idx
  on public.solicitacoes_titular (contato, created_at desc);

alter table public.solicitacoes_titular enable row level security;

drop policy if exists solicitacoes_titular_le_propria_ou_admin on public.solicitacoes_titular;
create policy solicitacoes_titular_le_propria_ou_admin on public.solicitacoes_titular
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists solicitacoes_titular_admin_atualiza on public.solicitacoes_titular;
create policy solicitacoes_titular_admin_atualiza on public.solicitacoes_titular
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 3) portfolio_fotos: consentimento de terceiros e capa manual -------------------
alter table public.portfolio_fotos
  add column if not exists contem_pessoas boolean not null default false,
  add column if not exists consentimento_terceiros_confirmado boolean not null default false,
  add column if not exists consentimento_terceiros_em timestamptz,
  add column if not exists capa boolean not null default false;

create unique index if not exists portfolio_fotos_uma_capa_por_projeto
  on public.portfolio_fotos (projeto_id) where capa;

-- 4) registrar_solicitacao_titular (aberta a anon, com limite por contato) -------
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
    'acesso', 'correcao', 'exclusao', 'portabilidade', 'revogacao', 'oposicao'
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

-- 5) anonimizar_dados_titular (somente admin) -----------------------------------
create or replace function public.anonimizar_dados_titular(
  p_user_id uuid default null, p_whatsapp text default null, p_solicitacao_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_whatsapp text := nullif(btrim(coalesce(p_whatsapp, '')), '');
  v_projetos integer := 0;
  v_orcamentos integer := 0;
  v_avaliacoes integer := 0;
  v_profiles integer := 0;
  v_resultado jsonb;
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores podem anonimizar dados' using errcode = '42501';
  end if;

  if p_user_id is null and v_whatsapp is null then
    raise exception 'Informe o usuário ou o WhatsApp do titular' using errcode = '22023';
  end if;

  update public.portfolio_projetos
     set cliente_nome = 'Cliente anonimizado',
         cliente_whatsapp = ''
   where (p_user_id is not null and cliente_user_id = p_user_id)
      or (v_whatsapp is not null and cliente_whatsapp = v_whatsapp);
  get diagnostics v_projetos = row_count;

  update public.orcamentos
     set cliente_nome = 'Cliente anonimizado',
         cliente_whatsapp = null
   where (p_user_id is not null and cliente_id = p_user_id)
      or (v_whatsapp is not null and cliente_whatsapp = v_whatsapp);
  get diagnostics v_orcamentos = row_count;

  if p_user_id is not null then
    update public.avaliacoes
       set cliente_nome = 'Cliente anonimizado',
           cliente_foto_url = null
     where cliente_id = p_user_id;
    get diagnostics v_avaliacoes = row_count;

    update public.profiles
       set full_name = null, avatar_url = null, whatsapp = null,
           logradouro = null, numero = null, complemento = null,
           bairro = null, cidade = null, uf = null
     where id = p_user_id;
    get diagnostics v_profiles = row_count;
  end if;

  v_resultado := jsonb_build_object(
    'portfolio_projetos', v_projetos,
    'orcamentos', v_orcamentos,
    'avaliacoes', v_avaliacoes,
    'profiles', v_profiles
  );

  if p_solicitacao_id is not null then
    update public.solicitacoes_titular
       set status = 'atendida',
           respondido_em = now(),
           atendido_por = (select auth.uid()),
           updated_at = now()
     where id = p_solicitacao_id;
  end if;

  insert into public.logs_atividades (acao, usuario_id, entidade_tipo, entidade_id, detalhes)
  values (
    'ANONIMIZACAO_TITULAR',
    (select auth.uid()),
    'titular',
    p_user_id::text,
    v_resultado || jsonb_build_object('solicitacao_id', p_solicitacao_id)
  );

  return v_resultado;
end;
$function$;

revoke all on function public.anonimizar_dados_titular(uuid, text, uuid) from public, anon;
grant execute on function public.anonimizar_dados_titular(uuid, text, uuid) to authenticated, service_role;