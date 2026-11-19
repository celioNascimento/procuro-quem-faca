-- Ouro e Diamante (doc 19, Etapas 4 e 5): selos de SEGURO de responsabilidade civil e de CND federal.
--
--  Nível (sempre calculado, nunca editado à mão):
--    Bronze   = CNPJ ativo aprovado e vigente
--    Prata    = Bronze + Experiência no PQF
--    Ouro     = Prata + seguro aprovado e vigente
--    Diamante = Ouro + CND federal aprovada e vigente
--
--  Como o selo nasce (mesmo desenho do CNPJ, com conferência humana):
--    1) o prestador envia os dados e o comprovante (PDF/foto) para uma área PRIVADA;
--    2) a equipe confere o documento e, ao aprovar, informa a validade (seguro: a da apólice;
--       CND: data de emissão + 180 dias, Portaria Conjunta RFB/PGFN 1.751/2014);
--    3) o arquivo é apagado depois da decisão; guardamos só o resumo e a validade;
--    4) quando vence, o selo sai sozinho (selos_publicos e o nível só contam o vigente) e um job
--       marca a verificação como 'expirada' e avisa o prestador 30, 15 e 3 dias antes.
--  Escrita só por funções (o prestador não insere nem altera direto; o admin só decide).
--  O PQF só verifica apólice que o prestador já tem: não vende nem recomenda seguro.
-- Depende de public.is_admin() e da migração 20261117150000_verificacoes_e_cnpj.sql.

-- ---------------------------------------------------------------------------
-- 1) Área privada dos comprovantes
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verificacoes-docs', 'verificacoes-docs', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "verificacoes_docs_envia_proprio" on storage.objects;
drop policy if exists "verificacoes_docs_le" on storage.objects;
drop policy if exists "verificacoes_docs_apaga" on storage.objects;

-- Cada pessoa só envia para a própria pasta (<user_id>/...).
create policy "verificacoes_docs_envia_proprio" on storage.objects for insert to authenticated
  with check (bucket_id = 'verificacoes-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Lê: o próprio dono do arquivo e o admin (para conferir). Ninguém mais.
create policy "verificacoes_docs_le" on storage.objects for select to authenticated
  using (bucket_id = 'verificacoes-docs'
         and (owner_id = (select auth.uid())::text or (select public.is_admin())));

-- Apaga: o dono (trocar o arquivo) e o admin (apagar depois de conferir).
create policy "verificacoes_docs_apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'verificacoes-docs'
         and (owner_id = (select auth.uid())::text or (select public.is_admin())));

-- ---------------------------------------------------------------------------
-- 2) Envio do pedido pelo prestador
-- ---------------------------------------------------------------------------
-- p_dados: seguro -> {seguradora, numero_apolice, validade_informada (AAAA-MM-DD)}; cnd -> {}.
-- p_arquivo: caminho no bucket, sempre <meu user_id>/...
-- Regras: só o dono de um perfil; um pedido por vez; novo pedido só se não há selo, se foi rejeitado,
-- se venceu, ou se faltam 30 dias ou menos (renovação: o selo atual continua valendo até decidirem).
create or replace function public.enviar_documento_verificacao(
  p_tipo    text,
  p_dados   jsonb,
  p_arquivo text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_prestador  bigint;
  v_atual      public.prestador_verificacoes%rowtype;
  v_pedido     jsonb;
  v_seguradora text;
  v_apolice    text;
  v_validade   date;
  v_id         uuid;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta' using errcode = '42501';
  end if;
  if p_tipo not in ('seguro', 'cnd') then
    raise exception 'Tipo inválido' using errcode = '22023';
  end if;

  select p.id into v_prestador from public.prestadores p where p.user_id = v_uid;
  if v_prestador is null then
    raise exception 'Você ainda não tem perfil profissional' using errcode = '42501';
  end if;

  if p_arquivo is null or split_part(p_arquivo, '/', 1) <> v_uid::text or length(p_arquivo) > 300 then
    raise exception 'Arquivo inválido' using errcode = '22023';
  end if;

  if p_tipo = 'seguro' then
    v_seguradora := nullif(btrim(coalesce(p_dados ->> 'seguradora', '')), '');
    v_apolice    := nullif(btrim(coalesce(p_dados ->> 'numero_apolice', '')), '');
    begin
      v_validade := (p_dados ->> 'validade_informada')::date;
    exception when others then
      raise exception 'Validade inválida' using errcode = '22023';
    end;
    if v_seguradora is null or length(v_seguradora) > 80 then
      raise exception 'Informe a seguradora (até 80 caracteres)' using errcode = '22023';
    end if;
    if v_apolice is null or length(v_apolice) > 40 then
      raise exception 'Informe o número da apólice (até 40 caracteres)' using errcode = '22023';
    end if;
    if v_validade is null or v_validade < current_date then
      raise exception 'A apólice precisa estar dentro da validade' using errcode = '22023';
    end if;
    v_pedido := jsonb_build_object(
      'seguradora', v_seguradora, 'numero_apolice', v_apolice,
      'validade_informada', v_validade, 'arquivo', p_arquivo, 'enviado_em', now());
  else
    v_pedido := jsonb_build_object('arquivo', p_arquivo, 'enviado_em', now());
  end if;

  select * into v_atual from public.prestador_verificacoes
   where prestador_id = v_prestador and tipo = p_tipo for update;

  if not found then
    insert into public.prestador_verificacoes (prestador_id, tipo, status, dados, fonte_validacao)
    values (v_prestador, p_tipo, 'pendente', jsonb_build_object('pedido', v_pedido), 'curadoria_manual')
    returning id into v_id;
    return v_id;
  end if;

  if v_atual.dados ? 'pedido' then
    raise exception 'Já existe um pedido em análise' using errcode = '22023';
  end if;

  if v_atual.status = 'aprovada'
     and v_atual.valido_ate is not null and v_atual.valido_ate >= current_date
     and v_atual.valido_ate > current_date + 30 then
    raise exception 'Seu selo está válido; dá para renovar nos últimos 30 dias' using errcode = '22023';
  end if;

  update public.prestador_verificacoes
     set status = case when status = 'aprovada' and valido_ate >= current_date then 'aprovada' else 'pendente' end,
         dados  = (dados - 'ultima_rejeicao') || jsonb_build_object('pedido', v_pedido),
         fonte_validacao = 'curadoria_manual'
   where id = v_atual.id;
  return v_atual.id;
end;
$$;
revoke all on function public.enviar_documento_verificacao(text, jsonb, text) from public, anon;
grant execute on function public.enviar_documento_verificacao(text, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Fila do admin
-- ---------------------------------------------------------------------------
create or replace function public.admin_fila_documentos(p_filtro text default 'pendentes')
returns table (
  verificacao_id uuid,
  prestador_id   bigint,
  prestador_nome text,
  prestador_slug text,
  tipo           text,
  status         text,
  dados          jsonb,
  valido_ate     date,
  criado_em      timestamptz,
  verificado_em  timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  if p_filtro not in ('pendentes', 'aprovadas', 'rejeitadas') then
    raise exception 'Filtro inválido' using errcode = '22023';
  end if;

  return query
    select v.id, v.prestador_id, p.nome, p.slug, v.tipo, v.status, v.dados, v.valido_ate, v.criado_em, v.verificado_em
      from public.prestador_verificacoes v
      join public.prestadores p on p.id = v.prestador_id
     where v.tipo in ('seguro', 'cnd')
       and case p_filtro
             when 'pendentes'  then v.dados ? 'pedido'
             when 'aprovadas'  then v.status = 'aprovada' and not (v.dados ? 'pedido')
             else v.status = 'rejeitada'
           end
     order by v.criado_em asc;
end;
$$;
revoke all on function public.admin_fila_documentos(text) from public, anon;
grant execute on function public.admin_fila_documentos(text) to authenticated;

-- Decide um pedido. Devolve o caminho do arquivo para o painel apagar do bucket (SQL não apaga storage).
--  seguro: aprovar exige p_valido_ate (a validade que está na apólice), de hoje até 3 anos.
--  cnd:    aprovar exige p_emissao (data de emissão da certidão); vale emissão + 180 dias e não pode já ter vencido.
create or replace function public.admin_decidir_documento(
  p_verificacao_id uuid,
  p_decisao        text,
  p_motivo         text default null,
  p_valido_ate     date default null,
  p_emissao        date default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v        public.prestador_verificacoes%rowtype;
  v_arq    text;
  v_valido date;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
  v_vigente boolean;
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  if p_decisao not in ('aprovada', 'rejeitada') then
    raise exception 'Decisão inválida' using errcode = '22023';
  end if;

  select * into v from public.prestador_verificacoes where id = p_verificacao_id for update;
  if not found then
    raise exception 'Verificação não encontrada' using errcode = 'P0002';
  end if;
  if v.tipo not in ('seguro', 'cnd') then
    raise exception 'Esta tela só decide seguro e CND' using errcode = '22023';
  end if;
  if not (v.dados ? 'pedido') then
    raise exception 'Não há pedido em análise' using errcode = '22023';
  end if;

  v_arq := v.dados -> 'pedido' ->> 'arquivo';
  v_vigente := v.status = 'aprovada' and v.valido_ate is not null and v.valido_ate >= current_date;

  if p_decisao = 'aprovada' then
    if v.tipo = 'seguro' then
      if p_valido_ate is null or p_valido_ate < current_date or p_valido_ate > current_date + 1096 then
        raise exception 'Informe a validade da apólice (de hoje até 3 anos)' using errcode = '22023';
      end if;
      v_valido := p_valido_ate;
    else
      if p_emissao is null or p_emissao > current_date then
        raise exception 'Informe a data de emissão da certidão' using errcode = '22023';
      end if;
      v_valido := p_emissao + 180;
      if v_valido < current_date then
        raise exception 'A certidão já venceu (vale 180 dias da emissão)' using errcode = '22023';
      end if;
    end if;

    update public.prestador_verificacoes
       set status         = 'aprovada',
           valido_ate     = v_valido,
           verificado_por = (select auth.uid()),
           verificado_em  = now(),
           dados          = (dados - 'pedido' - 'ultima_rejeicao' - 'avisos') || jsonb_build_object(
                              'conferido', (dados -> 'pedido') - 'arquivo'
                                           || case when v.tipo = 'cnd' then jsonb_build_object('emissao', p_emissao) else '{}'::jsonb end,
                              'decisao', jsonb_build_object('resultado', 'aprovada', 'motivo', v_motivo, 'em', now()))
     where id = p_verificacao_id;
  else
    -- Renovação recusada: o selo vigente continua; só registra a recusa. Primeiro pedido recusado: rejeitada.
    update public.prestador_verificacoes
       set status         = case when v_vigente then 'aprovada' else 'rejeitada' end,
           verificado_por = (select auth.uid()),
           verificado_em  = now(),
           dados          = (dados - 'pedido') || jsonb_build_object(
                              'ultima_rejeicao', jsonb_build_object('motivo', v_motivo, 'em', now()),
                              'decisao', jsonb_build_object('resultado', 'rejeitada', 'motivo', v_motivo, 'em', now()))
     where id = p_verificacao_id;
  end if;

  return v_arq;
end;
$$;
revoke all on function public.admin_decidir_documento(uuid, text, text, date, date) from public, anon;
grant execute on function public.admin_decidir_documento(uuid, text, text, date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Nível: Ouro e Diamante
-- ---------------------------------------------------------------------------
create or replace function public.niveis_dos_prestadores(p_prestador_ids bigint[])
returns table (prestador_id bigint, nivel text)
language sql
stable
security definer
set search_path = ''
as $$
  with vigentes as (
    select distinct v.prestador_id
      from public.prestador_verificacoes v
     where v.prestador_id = any (p_prestador_ids)
       and v.tipo = 'cnpj'
       and v.status = 'aprovada'
       and (v.valido_ate is null or v.valido_ate >= current_date)
  ),
  experiencia as materialized (
    select e.prestador_id from public.experiencia_no_pqf(p_prestador_ids) e where e.atingido
  ),
  documentos as (
    select v.prestador_id, v.tipo
      from public.prestador_verificacoes v
     where v.prestador_id = any (p_prestador_ids)
       and v.tipo in ('seguro', 'cnd')
       and v.status = 'aprovada'
       and v.valido_ate is not null and v.valido_ate >= current_date
  )
  select vg.prestador_id,
         case
           when not exists (select 1 from experiencia x where x.prestador_id = vg.prestador_id) then 'bronze'
           when not exists (select 1 from documentos d where d.prestador_id = vg.prestador_id and d.tipo = 'seguro') then 'prata'
           when not exists (select 1 from documentos d where d.prestador_id = vg.prestador_id and d.tipo = 'cnd') then 'ouro'
           else 'diamante'
         end
    from vigentes vg;
$$;
revoke all on function public.niveis_dos_prestadores(bigint[]) from public;
grant execute on function public.niveis_dos_prestadores(bigint[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Vencimento e avisos (só o servidor executa, via rota de cron)
-- ---------------------------------------------------------------------------
-- Marca como 'expirada' o seguro/CND aprovado que venceu (o selo já saiu sozinho; isto só deixa o estado fiel).
create or replace function public.verificacoes_expirar()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  update public.prestador_verificacoes
     set status = 'expirada'
   where tipo in ('seguro', 'cnd') and status = 'aprovada'
     and valido_ate is not null and valido_ate < current_date;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.verificacoes_expirar() from public, anon, authenticated;
grant execute on function public.verificacoes_expirar() to service_role;

-- Quem deve ser avisado hoje: faltam 30, 15 ou 3 dias e esse aviso ainda não foi enviado. Devolve o dono (user_id).
create or replace function public.verificacoes_a_avisar()
returns table (verificacao_id uuid, user_id uuid, tipo text, valido_ate date, dias integer)
language sql
stable
security definer
set search_path = ''
as $$
  select v.id, p.user_id, v.tipo, v.valido_ate, (v.valido_ate - current_date)::integer
    from public.prestador_verificacoes v
    join public.prestadores p on p.id = v.prestador_id
   where v.tipo in ('seguro', 'cnd') and v.status = 'aprovada'
     and v.valido_ate is not null
     and (v.valido_ate - current_date) in (30, 15, 3)
     and not (coalesce(v.dados -> 'avisos', '[]'::jsonb) @> to_jsonb(array[(v.valido_ate - current_date)]))
     and p.user_id is not null;
$$;
revoke all on function public.verificacoes_a_avisar() from public, anon, authenticated;
grant execute on function public.verificacoes_a_avisar() to service_role;

create or replace function public.verificacoes_marcar_aviso(p_verificacao_id uuid, p_dias integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.prestador_verificacoes
     set dados = jsonb_set(dados, '{avisos}', coalesce(dados -> 'avisos', '[]'::jsonb) || to_jsonb(p_dias))
   where id = p_verificacao_id;
$$;
revoke all on function public.verificacoes_marcar_aviso(uuid, integer) from public, anon, authenticated;
grant execute on function public.verificacoes_marcar_aviso(uuid, integer) to service_role;
