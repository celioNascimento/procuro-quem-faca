-- Remove os backups temporários de 14/10/2026 (cliques e visitas): sem uso e sem dado pessoal direto.
-- Backups não devem ficar indefinidamente no banco (minimização de dados).
drop table if exists public.bkp_cliques_20261014;
drop table if exists public.bkp_visitas_20261014;