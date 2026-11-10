-- NÃO APLICADO AINDA. Aplicar SOMENTE DEPOIS do deploy do app com a reivindicação por token
-- (app/reivindicar, hooks/useCadastroPrestador, lib/services/reivindicacao.service).
-- Antes do deploy, o cadastro antigo ainda usa a policy "Reivindicação de Perfil".
--
-- 1) Remove a brecha: qualquer usuário logado podia gravar o próprio user_id em perfil sem dono.
--    Os donos continuam editando o próprio perfil por outras policies já existentes
--    ("Dono do perfil", "Acesso Total ao Próprio Perfil" etc.).
drop policy if exists "Reivindicação de Perfil" on public.prestadores;

-- 2) Troca a policy de admin que usava e-mail fixo pela função is_admin() (perfis_admin).
--    Conferido em 10/11/2026: o único admin (owner) é o mesmo e-mail que estava na policy.
drop policy if exists "Admin pode atualizar qualquer prestador" on public.prestadores;
create policy "Admin pode atualizar qualquer prestador" on public.prestadores
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
