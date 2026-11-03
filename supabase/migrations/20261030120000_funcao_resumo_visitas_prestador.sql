-- Resumo de visitas do perfil para o painel do prestador (Fase 1).
--
-- Agrega no banco, sem trazer linhas brutas para o navegador: visitas dos
-- últimos 7 e 30 dias, as dos 7 e 30 dias imediatamente anteriores (para a
-- variação) e o total de todos os tempos.
--
-- Segurança: SECURITY DEFINER sem parâmetros. O prestador é descoberto por
-- auth.uid(), então cada pessoa só lê as visitas do(s) próprio(s) perfil(is).
-- Quem não é prestador (ou não está logado) recebe zero linhas. Só o papel
-- authenticated executa a função.
--
-- Desempenho: lê visitas_perfil pelo índice (prestador_id, criado_em desc).
--
-- Idempotente (create or replace + revoke/grant).

create or replace function public.resumo_visitas_prestador()
returns table (
  visitas_7d            integer,
  visitas_7d_anterior   integer,
  visitas_30d           integer,
  visitas_30d_anterior  integer,
  visitas_total         integer
)
language sql
stable
security definer
set search_path to ''
as $function$
  with meus as (
    select p.id
    from public.prestadores p
    where p.user_id = (select auth.uid())
  )
  select
    (count(*) filter (where v.criado_em >= now() - interval '7 days'))::integer,
    (count(*) filter (where v.criado_em >= now() - interval '14 days'
                        and v.criado_em <  now() - interval '7 days'))::integer,
    (count(*) filter (where v.criado_em >= now() - interval '30 days'))::integer,
    (count(*) filter (where v.criado_em >= now() - interval '60 days'
                        and v.criado_em <  now() - interval '30 days'))::integer,
    count(*)::integer
  from meus m
  join public.visitas_perfil v on v.prestador_id = m.id
  -- sem prestador vinculado ao usuário: zero linhas, em vez de uma linha de zeros
  having exists (select 1 from meus);
$function$;

revoke all on function public.resumo_visitas_prestador() from public;
revoke all on function public.resumo_visitas_prestador() from anon;
grant execute on function public.resumo_visitas_prestador() to authenticated;
