-- Garantia: todas as escritas passam a ser feitas por funções do banco que conferem QUEM está chamando
-- e se a mudança de status é permitida. Antes, as políticas de INSERT/UPDATE de solicitacoes_garantia
-- deixavam qualquer parte do caso gravar QUALQUER coluna (status, nota_resultante, prazo...), e o anon
-- tinha permissão de tabela inteira. Reversão: supabase/reversoes/20261115100000_garantia_funcoes_seguras.down.sql

-- 1) Um caso ativo por projeto ------------------------------------------------------------------
create unique index if not exists uq_solicitacoes_garantia_um_ativo_por_projeto
  on public.solicitacoes_garantia (projeto_id)
  where status in ('aguardando_aceite_cliente', 'aberta', 'respondida');

-- 2) Prazo em dias úteis (seg-sex, sem feriados — mesma regra que o app usava) -------------------
create or replace function public.garantia_prazo_uteis(p_dias integer)
returns date
language plpgsql
stable
set search_path = public
as $$
declare
  d date := (now() at time zone 'America/Sao_Paulo')::date;
  restantes integer := p_dias;
begin
  while restantes > 0 loop
    d := d + 1;
    if extract(isodow from d) < 6 then
      restantes := restantes - 1;
    end if;
  end loop;
  return d;
end;
$$;

-- 3) Cliente abre o caso -------------------------------------------------------------------------
create or replace function public.garantia_abrir_caso(p_projeto_id uuid, p_descricao text)
returns public.solicitacoes_garantia
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_proj record;
  v_dias integer;
  v_tipo text;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_caso public.solicitacoes_garantia;
begin
  if v_uid is null then raise exception 'Faça login para continuar.'; end if;
  if char_length(btrim(coalesce(p_descricao, ''))) < 20 then
    raise exception 'Descreva o problema com pelo menos 20 caracteres.';
  end if;
  if char_length(p_descricao) > 2000 then
    raise exception 'A descrição do problema está longa demais.';
  end if;

  select pp.id, pp.status, pp.data_conclusao, pp.prestador_id, pp.cliente_user_id, pr.garantia_dias
    into v_proj
    from public.portfolio_projetos pp
    join public.prestadores pr on pr.id = pp.prestador_id
   where pp.id = p_projeto_id;

  if not found or v_proj.cliente_user_id is distinct from v_uid then
    raise exception 'Apenas o cliente deste serviço pode abrir este caso.';
  end if;
  if v_proj.status <> 'finalizado' or v_proj.data_conclusao is null then
    raise exception 'O serviço ainda não foi finalizado.';
  end if;

  if coalesce(v_proj.garantia_dias, 0) > 0 then
    v_tipo := 'garantia';
    v_dias := v_proj.garantia_dias;
  else
    v_tipo := 'reclamacao';
    v_dias := 15;
  end if;
  if v_hoje > v_proj.data_conclusao + v_dias then
    raise exception 'O prazo para abrir este caso já terminou.';
  end if;

  if exists (
    select 1 from public.solicitacoes_garantia
     where projeto_id = p_projeto_id
       and status in ('aguardando_aceite_cliente', 'aberta', 'respondida')
  ) then
    raise exception 'Já existe um caso em andamento para este serviço.';
  end if;

  insert into public.solicitacoes_garantia
    (projeto_id, prestador_id, cliente_user_id, origem, tipo, status, prazo_resposta, descricao_problema)
  values
    (p_projeto_id, v_proj.prestador_id, v_uid, 'cliente', v_tipo, 'aberta',
     public.garantia_prazo_uteis(5), btrim(p_descricao))
  returning * into v_caso;

  return v_caso;
end;
$$;

-- 4) Prestador oferece reparo a uma avaliação negativa -------------------------------------------
create or replace function public.garantia_oferecer_reparo(p_avaliacao_id uuid, p_descricao text)
returns public.solicitacoes_garantia
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_av record;
  v_cliente uuid;
  v_caso public.solicitacoes_garantia;
begin
  if v_uid is null then raise exception 'Faça login para continuar.'; end if;
  if char_length(btrim(coalesce(p_descricao, ''))) < 20 or char_length(p_descricao) > 2000 then
    raise exception 'Descreva o reparo que você propõe (de 20 a 2000 caracteres).';
  end if;

  select a.id, a.projeto_id, a.prestador_id, a.nota, a.indica, a.oculta_por_garantia, pr.user_id, pr.garantia_dias
    into v_av
    from public.avaliacoes a
    join public.prestadores pr on pr.id = a.prestador_id
   where a.id = p_avaliacao_id;

  if not found or v_av.user_id is distinct from v_uid then
    raise exception 'Esta avaliação não pertence ao seu perfil.';
  end if;
  if coalesce(v_av.garantia_dias, 0) <= 0 then
    raise exception 'Oferecer reparo exige uma garantia configurada no seu perfil.';
  end if;
  if v_av.oculta_por_garantia then
    raise exception 'Esta avaliação já foi resolvida via garantia.';
  end if;
  if not (coalesce(v_av.indica, true) = false or v_av.nota <= 3) then
    raise exception 'Só é possível oferecer reparo a uma avaliação negativa.';
  end if;

  select cliente_user_id into v_cliente from public.portfolio_projetos where id = v_av.projeto_id;
  if v_cliente is null then raise exception 'Cliente do serviço não encontrado.'; end if;

  if exists (select 1 from public.solicitacoes_garantia where avaliacao_id = p_avaliacao_id and origem = 'prestador') then
    raise exception 'Você já ofereceu reparo para esta avaliação.';
  end if;
  if exists (
    select 1 from public.solicitacoes_garantia
     where projeto_id = v_av.projeto_id
       and status in ('aguardando_aceite_cliente', 'aberta', 'respondida')
  ) then
    raise exception 'Já existe um caso em andamento para este serviço.';
  end if;

  insert into public.solicitacoes_garantia
    (projeto_id, prestador_id, cliente_user_id, avaliacao_id, origem, tipo, status, descricao_problema)
  values
    (v_av.projeto_id, v_av.prestador_id, v_cliente, p_avaliacao_id, 'prestador', 'garantia',
     'aguardando_aceite_cliente', btrim(p_descricao))
  returning * into v_caso;

  return v_caso;
end;
$$;

-- 5) Cliente aceita / recusa a oferta ------------------------------------------------------------
create or replace function public.garantia_aceitar_oferta(p_caso_id uuid)
returns public.solicitacoes_garantia
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caso public.solicitacoes_garantia;
begin
  update public.solicitacoes_garantia
     set status = 'aberta', prazo_resposta = public.garantia_prazo_uteis(5)
   where id = p_caso_id
     and cliente_user_id = auth.uid()
     and status = 'aguardando_aceite_cliente'
  returning * into v_caso;
  if not found then raise exception 'Esta oferta não está mais disponível.'; end if;
  return v_caso;
end;
$$;

create or replace function public.garantia_recusar_oferta(p_caso_id uuid)
returns public.solicitacoes_garantia
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caso public.solicitacoes_garantia;
begin
  update public.solicitacoes_garantia
     set status = 'recusada'
   where id = p_caso_id
     and cliente_user_id = auth.uid()
     and status = 'aguardando_aceite_cliente'
  returning * into v_caso;
  if not found then raise exception 'Esta oferta não está mais disponível.'; end if;
  return v_caso;
end;
$$;

-- 6) Prestador responde --------------------------------------------------------------------------
create or replace function public.garantia_responder(p_caso_id uuid, p_resposta text)
returns public.solicitacoes_garantia
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caso public.solicitacoes_garantia;
begin
  if char_length(btrim(coalesce(p_resposta, ''))) < 1 or char_length(p_resposta) > 2000 then
    raise exception 'Escreva a sua resposta (até 2000 caracteres).';
  end if;
  update public.solicitacoes_garantia sg
     set status = 'respondida',
         resposta_prestador_garantia = btrim(p_resposta),
         data_resposta = now()
   where sg.id = p_caso_id
     and sg.status = 'aberta'
     and exists (select 1 from public.prestadores p where p.id = sg.prestador_id and p.user_id = auth.uid())
  returning * into v_caso;
  if not found then raise exception 'Este caso não está aguardando a sua resposta.'; end if;
  return v_caso;
end;
$$;

-- 7) Cliente confirma que resolveu (caso + avaliação na mesma transação) -------------------------
create or replace function public.garantia_confirmar_resolucao(
  p_caso_id uuid,
  p_descricao text,
  p_fotos text[],
  p_nova_nota integer
)
returns public.solicitacoes_garantia
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atual public.solicitacoes_garantia;
  v_nota integer;
  v_caso public.solicitacoes_garantia;
begin
  select * into v_atual from public.solicitacoes_garantia
   where id = p_caso_id and cliente_user_id = auth.uid() for update;
  if not found then raise exception 'Caso não encontrado.'; end if;
  if v_atual.status <> 'respondida' then
    raise exception 'Só é possível confirmar a resolução de um caso já respondido.';
  end if;
  if char_length(coalesce(p_descricao, '')) > 2000 or coalesce(array_length(p_fotos, 1), 0) > 20 then
    raise exception 'Dados da resolução inválidos.';
  end if;

  if v_atual.origem = 'prestador' then
    v_nota := 3;
  else
    if p_nova_nota is null or p_nova_nota < 1 or p_nova_nota > 5 then
      raise exception 'Informe uma nota de 1 a 5 ao confirmar a resolução.';
    end if;
    v_nota := p_nova_nota;
  end if;

  update public.solicitacoes_garantia
     set status = 'resolvida',
         resolucao_descricao = nullif(btrim(coalesce(p_descricao, '')), ''),
         fotos_resolucao = coalesce(p_fotos, '{}'),
         data_resolucao = now(),
         nota_resultante = v_nota
   where id = p_caso_id
  returning * into v_caso;

  if v_caso.avaliacao_id is not null then
    if v_caso.origem = 'prestador' then
      update public.avaliacoes
         set nota_efetiva = v_nota, oculta_por_garantia = true, resolvido_via_garantia_id = v_caso.id
       where id = v_caso.avaliacao_id;
    else
      update public.avaliacoes set nota_efetiva = v_nota where id = v_caso.avaliacao_id;
    end if;
  end if;

  return v_caso;
end;
$$;

-- 8) Cliente diz que ainda não resolveu → reabre --------------------------------------------------
create or replace function public.garantia_reabrir(p_caso_id uuid)
returns public.solicitacoes_garantia
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caso public.solicitacoes_garantia;
begin
  update public.solicitacoes_garantia
     set status = 'aberta',
         prazo_resposta = public.garantia_prazo_uteis(5),
         resposta_prestador_garantia = null,
         data_resposta = null
   where id = p_caso_id
     and cliente_user_id = auth.uid()
     and status = 'respondida'
  returning * into v_caso;
  if not found then raise exception 'Este caso não pode ser reaberto agora.'; end if;
  return v_caso;
end;
$$;

-- 9) Rotina diária (só service_role / cron) -------------------------------------------------------
-- a) casos abertos com prazo vencido viram sem_resposta (nota 1);
-- b) ofertas de reparo paradas há mais de 15 dias viram recusada (não penaliza ninguém).
create or replace function public.garantia_processar_vencidos()
returns table (caso_id uuid, prestador_id bigint, cliente_user_id uuid, novo_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  return query
  with vencidos as (
    update public.solicitacoes_garantia sg
       set status = 'sem_resposta', nota_resultante = 1
     where sg.status = 'aberta' and sg.prazo_resposta < v_hoje
    returning sg.id, sg.prestador_id, sg.cliente_user_id, sg.avaliacao_id
  ), propaga as (
    update public.avaliacoes a set nota_efetiva = 1
      from vencidos v where a.id = v.avaliacao_id
    returning a.id
  )
  select v.id, v.prestador_id, v.cliente_user_id, 'sem_resposta'::text from vencidos v;

  return query
  update public.solicitacoes_garantia sg
     set status = 'recusada'
   where sg.status = 'aguardando_aceite_cliente' and sg.created_at < now() - interval '15 days'
  returning sg.id, sg.prestador_id, sg.cliente_user_id, 'recusada'::text;
end;
$$;

revoke all on function public.garantia_prazo_uteis(integer) from public, anon;
revoke all on function public.garantia_abrir_caso(uuid, text) from public, anon;
revoke all on function public.garantia_oferecer_reparo(uuid, text) from public, anon;
revoke all on function public.garantia_aceitar_oferta(uuid) from public, anon;
revoke all on function public.garantia_recusar_oferta(uuid) from public, anon;
revoke all on function public.garantia_responder(uuid, text) from public, anon;
revoke all on function public.garantia_confirmar_resolucao(uuid, text, text[], integer) from public, anon;
revoke all on function public.garantia_reabrir(uuid) from public, anon;
revoke all on function public.garantia_processar_vencidos() from public, anon, authenticated;

grant execute on function public.garantia_prazo_uteis(integer) to authenticated, service_role;
grant execute on function public.garantia_abrir_caso(uuid, text) to authenticated;
grant execute on function public.garantia_oferecer_reparo(uuid, text) to authenticated;
grant execute on function public.garantia_aceitar_oferta(uuid) to authenticated;
grant execute on function public.garantia_recusar_oferta(uuid) to authenticated;
grant execute on function public.garantia_responder(uuid, text) to authenticated;
grant execute on function public.garantia_confirmar_resolucao(uuid, text, text[], integer) to authenticated;
grant execute on function public.garantia_reabrir(uuid) to authenticated;
grant execute on function public.garantia_processar_vencidos() to service_role;

-- 10) Fim das escritas diretas na tabela ---------------------------------------------------------
drop policy if exists solicitacoes_garantia_insert on public.solicitacoes_garantia;
drop policy if exists solicitacoes_garantia_update on public.solicitacoes_garantia;

revoke insert, update, delete, truncate, references, trigger on public.solicitacoes_garantia from anon, authenticated;

-- anon (perfil público) lê só as colunas que o perfil usa — sem cliente_user_id, avaliacao_id, datas...
revoke select on public.solicitacoes_garantia from anon;
grant select (id, projeto_id, status, origem, tipo, descricao_problema, resposta_prestador_garantia,
              resolucao_descricao, nota_resultante)
  on public.solicitacoes_garantia to anon;

-- 11) Fotos e comentários: tira políticas duplicadas/abertas ---------------------------------------
drop policy if exists garantia_fotos_insert on public.garantia_fotos;
drop policy if exists garantia_fotos_select on public.garantia_fotos;
drop policy if exists garantia_fotos_update on public.garantia_fotos;
drop policy if exists garantia_comentarios_insert on public.garantia_comentarios;
drop policy if exists garantia_comentarios_select on public.garantia_comentarios;

-- ninguém marca a própria foto como pública: isso só acontece na rota do servidor (service_role)
drop policy if exists insercao_garantia_fotos_dono_do_caso on public.garantia_fotos;
create policy insercao_garantia_fotos_dono_do_caso on public.garantia_fotos
  for insert to authenticated
  with check (usuario_tem_acesso_ao_caso_garantia(caso_id) and coalesce(publica, false) = false);

revoke update on public.garantia_fotos from anon, authenticated;
grant update (legenda) on public.garantia_fotos to authenticated;
