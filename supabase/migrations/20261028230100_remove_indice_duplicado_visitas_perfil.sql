-- Remove o índice redundante de visitas_perfil.
--
-- idx_visitas_perfil_prestador_data (prestador_id, criado_em) e
-- idx_visitas_prestador_data (prestador_id, criado_em desc) cobrem as mesmas
-- consultas: um índice btree também é percorrido de trás para frente. O
-- segundo fica; o primeiro só custa espaço e tempo a cada INSERT.
--
-- Independente da migration anterior. Seguro rodar mais de uma vez.

drop index if exists public.idx_visitas_perfil_prestador_data;
