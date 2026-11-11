-- NÃO APLICADO AINDA. Aplicar SOMENTE DEPOIS do deploy do app que lê e grava nas tabelas
-- prestador_ativacao e prestador_bloqueio (telas de ativação e moderação, painel do prestador, estatísticas).
-- Antes do deploy, o app antigo ainda usa estas colunas.
--
-- Efeito: o funil de ativação, as observações e o motivo de bloqueio deixam de existir na tabela
-- pública `prestadores`, que qualquer visitante consegue ler.

-- 1) Perfis criados depois da cópia (migration 20261111140000) entram com os valores que têm hoje
insert into public.prestador_ativacao (prestador_id, status, enviado_em, respondeu_em, obs)
select id, coalesce(ativacao_status, 'nao_enviado'), ativacao_enviado_em, ativacao_respondeu_em, nullif(btrim(ativacao_obs), '')
  from public.prestadores
on conflict (prestador_id) do nothing;

insert into public.prestador_bloqueio (prestador_id, motivo)
select id, btrim(motivo_bloqueio) from public.prestadores where coalesce(btrim(motivo_bloqueio), '') <> ''
on conflict (prestador_id) do nothing;

-- 2) O gatilho de proteção citava motivo_bloqueio: sem este ajuste, apagar a coluna quebraria todo
--    salvamento de perfil feito por um prestador.
create or replace function public.prestadores_proteger_campos()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status          := 'pendente';
    new.verificado      := false;
    new.bloqueado       := false;
    new.aprovado_em     := null;
    new.cliques_whatsapp := 0;
  else
    new.verificado       := old.verificado;
    new.bloqueado        := old.bloqueado;
    new.aprovado_em      := old.aprovado_em;
    new.cliques_whatsapp := old.cliques_whatsapp;

    if new.status is distinct from old.status and new.status is distinct from 'pendente' then
      new.status := old.status;
    end if;
  end if;

  return new;
end
$function$;

-- 3) A view prestadores_ranqueados depende de motivo_bloqueio e não é usada por nenhum código do PQF
--    (nem por outra migration). Ela também expunha user_id, cliques_whatsapp e o motivo de bloqueio a
--    qualquer visitante. É removida. Para recriá-la sem campos internos, a definição que existia era:
--      SELECT p.id, p.created_at, p.nome, p.bio, p.whatsapp, p.foto_perfil, p.bairro, p.status, p.bloqueado,
--             p.habilidades, p.tags, p.estado_sigla, p.cidade_id, p.regiao_id, p.slug, p.cidades_atendidas,
--             p.origem_tipo, p.verificado, p.grupo_id, p.categoria_id,
--             COALESCE(avg(a.nota), 0) AS media_interna, count(DISTINCT prj.id) AS total_projetos
--        FROM prestadores p
--        LEFT JOIN avaliacoes a ON a.prestador_id = p.id
--        LEFT JOIN portfolio_projetos prj ON prj.prestador_id = p.id
--       WHERE p.status = 'ativo' GROUP BY p.id
--       ORDER BY media_interna DESC, total_projetos DESC;   (com security_invoker = true e GRANT SELECT apenas)
drop view if exists public.prestadores_ranqueados;

-- 4) Remove as colunas (o índice idx_prestadores_ativacao_status cai junto)
alter table public.prestadores
  drop column if exists ativacao_status,
  drop column if exists ativacao_enviado_em,
  drop column if exists ativacao_respondeu_em,
  drop column if exists ativacao_obs,
  drop column if exists motivo_bloqueio;
