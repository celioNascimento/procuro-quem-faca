-- Fotos de um trabalho só ficam visíveis ao público DEPOIS do aceite do cliente.
--
-- Antes: `portfolio_fotos` tinha a política "Fotos são visíveis publicamente" (using true). Qualquer pessoa,
-- sem login, lia a url de TODAS as fotos, inclusive as de trabalhos em rascunho ou com aceite pendente.
-- O perfil público só mostrava os trabalhos aceitos porque a TELA filtrava; o banco não.
--
-- Agora o banco decide. Uma foto é legível por:
--   - qualquer pessoa, se o trabalho já foi aceito (em_execucao) ou concluído (finalizado);
--   - o prestador dono do trabalho (já coberto pela política "Prestadores gerenciam suas próprias fotos");
--   - o cliente do trabalho (cliente_user_id = quem está logado);
--   - o admin.
-- A função é SECURITY DEFINER porque quem não está logado não tem leitura de todas as colunas de
-- portfolio_projetos; a função consulta só o necessário e devolve apenas verdadeiro ou falso.
--
-- ORDEM DE DEPLOY: publique primeiro o código que reivindica o link ANTES de carregar o trabalho
-- (hooks/useAcompanhamento.ts). Sem isso, na primeira abertura do link o cliente ainda não é o dono
-- (cliente_user_id nulo) e não enxergaria as fotos de um trabalho com aceite pendente.

create or replace function public.foto_do_projeto_pode_ser_vista(p_projeto_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portfolio_projetos p
    where p.id = p_projeto_id
      and (
        p.status in ('em_execucao', 'finalizado')
        or p.cliente_user_id = auth.uid()
        or exists (
          select 1 from public.prestadores pr
          where pr.id = p.prestador_id and pr.user_id = auth.uid()
        )
        or public.is_admin()
      )
  );
$$;

revoke all on function public.foto_do_projeto_pode_ser_vista(uuid) from public;
grant execute on function public.foto_do_projeto_pode_ser_vista(uuid) to anon, authenticated;

drop policy if exists "Fotos são visíveis publicamente" on public.portfolio_fotos;

create policy "Fotos visíveis só após o aceite"
  on public.portfolio_fotos
  for select
  using (public.foto_do_projeto_pode_ser_vista(projeto_id));

-- Arquivos: o bucket `portfolios` é público (a url de cada arquivo abre sem login) e tinha política de
-- leitura para todos, o que permitia LISTAR todos os arquivos do bucket, inclusive os de trabalhos ainda
-- não aceitos. Passa a valer: cada conta enxerga (e lista) só os arquivos que ela mesma enviou. Isso é
-- necessário porque o envio devolve a linha criada (INSERT ... RETURNING exige permissão de leitura).
-- A url direta continua funcionando para quem a recebe (perfil público, link do cliente), e o nome dos
-- arquivos já é aleatório (<prestador>/<número aleatório>).
drop policy if exists "Fotos do Portfólio são públicas" on storage.objects;
drop policy if exists "Permitir select para todos no perfil 6vd2cr_0" on storage.objects;

create policy "Quem enviou o arquivo do portfólio pode vê-lo"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'portfolios' and owner_id = (select auth.uid())::text);
