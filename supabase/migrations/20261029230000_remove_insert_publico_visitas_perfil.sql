-- Remove a política pública de INSERT em visitas_perfil.
--
-- Desde 29/10/2026 as visitas são gravadas no servidor, pela rota
-- /api/prestadores/visita-perfil, com a chave administrativa (que ignora o
-- RLS). O navegador não insere mais direto na tabela, então a política
-- "Qualquer um pode registrar visita" (INSERT para anon e authenticated, com
-- check true) deixou de ser necessária e só permitia inflar a contagem com a
-- chave pública.
--
-- Aplicar SOMENTE depois do deploy da rota e da validação no navegador. A
-- leitura continua igual: o prestador vê as próprias visitas e o admin vê todas.
-- Seguro rodar mais de uma vez.

drop policy if exists "Qualquer um pode registrar visita" on public.visitas_perfil;
