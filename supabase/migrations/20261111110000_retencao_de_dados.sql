-- JÁ APLICADO NO BANCO em 11/11/2026 (arquivo para versionar). Idempotente.
-- Retenção: apaga ou anonimiza dados vencidos, com prazos em tabela (não no código).
-- Regras pessoais (logs e pedidos do titular) nascem DESLIGADAS até os prazos serem confirmados.
-- Para ligar uma regra:   update public.retencao_regras set ativa = true where chave = '...';
-- Para mudar um prazo:    update public.retencao_regras set dias = 180 where chave = '...';
-- Prévia sem apagar nada: select public.admin_simular_retencao();   (como administrador)
create table if not exists public.retencao_regras (
  chave text primary key,
  descricao text not null,
  dias integer not null check (dias > 0),
  ativa boolean not null default false,
  ultima_execucao timestamptz,
  ultimo_total integer
);
alter table public.retencao_regras enable row level security;
revoke all on table public.retencao_regras from anon, authenticated;

insert into public.retencao_regras (chave, descricao, dias, ativa) values
  ('tokens_reivindicacao', 'Links pessoais de perfis sem conta que não foram usados', 90, true),
  ('eventos_anuncio_sessao', 'Eventos de sessão usados só para evitar contagem repetida de anúncios', 2, true),
  ('logs_atividades', 'Registros de atividade, com e-mail e identificação de quem agiu', 365, false),
  ('pedidos_titular_encerrados', 'Dados pessoais de pedidos de titulares já respondidos (mantém tipo, datas e protocolo)', 365, false)
on conflict (chave) do nothing;

create or replace function public.executar_retencao(
  p_simular boolean default true,
  p_incluir_inativas boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  r record;
  v_n integer;
  v_limite timestamptz;
  v_resultado jsonb := '{}'::jsonb;
begin
  for r in
    select * from public.retencao_regras
     where ativa or (p_simular and p_incluir_inativas)
     order by chave
  loop
    v_n := 0;
    v_limite := now() - make_interval(days => r.dias);

    if r.chave = 'tokens_reivindicacao' then
      if p_simular then
        select count(*) into v_n from public.prestador_tokens where criado_em < v_limite;
      else
        delete from public.prestador_tokens where criado_em < v_limite;
        get diagnostics v_n = row_count;
      end if;

    elsif r.chave = 'eventos_anuncio_sessao' then
      if p_simular then
        select count(*) into v_n from public.anuncios_eventos_sessao where criado_em < v_limite;
      else
        delete from public.anuncios_eventos_sessao where criado_em < v_limite;
        get diagnostics v_n = row_count;
      end if;

    elsif r.chave = 'logs_atividades' then
      if p_simular then
        select count(*) into v_n from public.logs_atividades where coalesce(created_at, criado_em) < v_limite;
      else
        delete from public.logs_atividades where coalesce(created_at, criado_em) < v_limite;
        get diagnostics v_n = row_count;
      end if;

    elsif r.chave = 'pedidos_titular_encerrados' then
      if p_simular then
        select count(*) into v_n from public.solicitacoes_titular
         where status in ('atendida', 'negada') and respondido_em < v_limite and contato <> 'removido';
      else
        update public.solicitacoes_titular
           set nome_solicitante = null, contato = 'removido', descricao = null, resposta = null
         where status in ('atendida', 'negada') and respondido_em < v_limite and contato <> 'removido';
        get diagnostics v_n = row_count;
      end if;
    end if;

    if not p_simular then
      update public.retencao_regras set ultima_execucao = now(), ultimo_total = v_n where chave = r.chave;
    end if;
    v_resultado := v_resultado || jsonb_build_object(r.chave, v_n);
  end loop;

  return jsonb_build_object('simulacao', p_simular, 'regras', v_resultado);
end;
$function$;
revoke all on function public.executar_retencao(boolean, boolean) from public, anon, authenticated;
grant execute on function public.executar_retencao(boolean, boolean) to service_role;

-- Prévia para administradores: mostra quanto seria apagado, inclusive nas regras desligadas. Não altera nada.
create or replace function public.admin_simular_retencao()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not (select public.is_admin()) then
    raise exception 'Apenas administradores' using errcode = '42501';
  end if;
  return public.executar_retencao(true, true);
end;
$function$;
revoke all on function public.admin_simular_retencao() from public, anon;
grant execute on function public.admin_simular_retencao() to authenticated, service_role;

-- Execução diária às 03:30 (horário de Brasília)
create extension if not exists pg_cron;
select cron.schedule('retencao-diaria', '30 6 * * *', $cron$select public.executar_retencao(false)$cron$);
