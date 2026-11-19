-- 20261119200000_seguranca_slug_curtidas_denuncias.sql
-- Varredura de segurança de 19/11. Três travas no banco (nenhuma muda o comportamento do app):
--  1) slug do prestador só com letras minúsculas, números, "_" e "-": sem "/", ".", ":" ou espaço. Sem isso, um slug
--     como "/site.com" viraria o link "//site.com" (sai do PQF) nos cards do feed e nos links de perfil.
--     O app já gera o slug assim (formatarParaSlug); esta trava barra quem escreve direto na API.
--     Se existir slug antigo fora do padrão, a migração falha inteira (nada é alterado): corrija o slug e rode de novo.
--  2) portfolio_curtidas: tira os privilégios de tabela (a RLS já negava tudo; curtir/descurtir passa só pelas RPCs).
--  3) denuncias.motivo: no máximo 3000 caracteres (o formulário público aceitava texto sem limite).
-- Ordem de produção: depois de 20261119190000.

alter table public.prestadores drop constraint if exists prestadores_slug_formato;
alter table public.prestadores add constraint prestadores_slug_formato check (slug ~ '^[a-z0-9_-]+$');

revoke all on public.portfolio_curtidas from anon, authenticated;

alter table public.denuncias drop constraint if exists denuncias_motivo_tamanho;
alter table public.denuncias add constraint denuncias_motivo_tamanho check (length(motivo) <= 3000);
