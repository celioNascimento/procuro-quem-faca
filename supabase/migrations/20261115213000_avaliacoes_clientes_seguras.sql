-- Avaliação do cliente pelo prestador (avaliacoes_clientes): regras seguras.
-- Já aplicada em produção; este arquivo é o registro no repositório.
--
-- 1) O prestador só avalia um trabalho SEU, já concluído, e só o cliente vinculado a ele.
--    (Antes, em produção, bastava ser dono de um perfil: dava para avaliar qualquer pessoa
--    em qualquer trabalho e ainda travar a avaliação do prestador verdadeiro.)
-- 2) O cliente só vê a nota que recebeu DEPOIS de ter avaliado o trabalho também.
--    Sem prazo de liberação: quem não avalia, não vê. O prestador sempre vê a que ele deu.
-- 3) Permissões mínimas: só leitura e inserção para quem está logado; ninguém anônimo.

-- Verifica se o trabalho já foi avaliado pelo cliente. SECURITY DEFINER para não depender
-- das regras de leitura da tabela avaliacoes (que só mostra avaliações marcadas como visíveis).
create or replace function public.cliente_ja_avaliou_trabalho(p_projeto_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.avaliacoes a
    where a.projeto_id = p_projeto_id and a.status = 'finalizado'
  );
$$;
revoke all on function public.cliente_ja_avaliou_trabalho(uuid) from public, anon;
grant execute on function public.cliente_ja_avaliou_trabalho(uuid) to authenticated;

-- Remove as regras anteriores (nomes do repositório e de produção)
drop policy if exists "prestador vê avaliações de seus clientes" on public.avaliacoes_clientes;
drop policy if exists "cliente vê sua avaliação" on public.avaliacoes_clientes;
drop policy if exists "prestador cria avaliação do projeto" on public.avaliacoes_clientes;
drop policy if exists "Cliente ve avaliacao recebida (double-blind)" on public.avaliacoes_clientes;
drop policy if exists "Prestador insere avaliacao de seu proprio projeto" on public.avaliacoes_clientes;
drop policy if exists "Prestador ve avaliacoes que fez" on public.avaliacoes_clientes;

create policy "Prestador ve avaliacoes que fez"
  on public.avaliacoes_clientes for select to authenticated
  using (prestador_id in (select id from public.prestadores where user_id = (select auth.uid())));

create policy "Cliente ve a avaliacao recebida depois de avaliar"
  on public.avaliacoes_clientes for select to authenticated
  using (
    cliente_user_id = (select auth.uid())
    and public.cliente_ja_avaliou_trabalho(projeto_id)
  );

create policy "Prestador avalia o cliente do proprio trabalho concluido"
  on public.avaliacoes_clientes for insert to authenticated
  with check (
    exists (
      select 1
      from public.prestadores p
      join public.portfolio_projetos pr on pr.prestador_id = p.id
      where p.id = avaliacoes_clientes.prestador_id
        and p.user_id = (select auth.uid())
        and pr.id = avaliacoes_clientes.projeto_id
        and pr.cliente_user_id is not null
        and pr.cliente_user_id = avaliacoes_clientes.cliente_user_id
        and pr.status = 'finalizado'
    )
  );

-- Permissões mínimas
revoke all on public.avaliacoes_clientes from anon;
revoke all on public.avaliacoes_clientes from authenticated;
grant select, insert on public.avaliacoes_clientes to authenticated;

-- No máximo 3 pontos positivos por avaliação (o formulário já limita; agora o banco também)
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.avaliacoes_clientes'::regclass and conname = 'avaliacoes_clientes_motivos_max3') then
    alter table public.avaliacoes_clientes
      add constraint avaliacoes_clientes_motivos_max3 check (coalesce(array_length(motivos, 1), 0) <= 3);
  end if;
end $$;
