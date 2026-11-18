-- Admin não edita o perfil de outras pessoas.
-- A policy "Admin pode atualizar qualquer prestador" deixava qualquer admin logado alterar
-- QUALQUER campo de QUALQUER prestador direto pelo navegador. O painel admin não usa isso:
-- ativação e bloqueio usam prestador_ativacao e prestador_bloqueio, e a decisão do CNPJ usa
-- a função admin_decidir_verificacao. Os donos continuam editando o próprio perfil pelas
-- policies "Dono do perfil" e "Acesso Total ao Próprio Perfil".
drop policy if exists "Admin pode atualizar qualquer prestador" on public.prestadores;
