-- Fecha brechas de acesso encontradas na auditoria de 15/11/2026 (já aplicada em produção).
--  1) denuncias: qualquer usuário logado lia e alterava TODAS as denúncias -> só administrador.
--     Quem denuncia continua podendo registrar (inserir) pela regra "denuncias_insert_publico".
--  2) portfolio_comentarios: "Acesso total via Token" (using true) deixava qualquer pessoa, até sem login,
--     ler, criar, alterar e apagar comentários -> só quem participa do trabalho (cliente vinculado ou prestador dono).
--  3) projeto_mensagens: leitura e inserção abertas a qualquer logado -> só quem participa do trabalho.
--  4) cidades/estados/regioes: "Admin pode ..." sem checar admin -> agora checa de fato.
--  5) Permissões que nenhuma tela usa (TRUNCATE, REFERENCES, TRIGGER) retiradas de anon e authenticated.

-- Papel da pessoa logada no trabalho: 'cliente' (cliente vinculado), 'prestador' (dono do perfil) ou qualquer um dos dois (null).
create or replace function public.usuario_tem_papel_no_projeto(p_projeto_id uuid, p_papel text default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.portfolio_projetos pp
    left join public.prestadores pr on pr.id = pp.prestador_id
    where pp.id = p_projeto_id
      and (
        (p_papel is distinct from 'prestador' and pp.cliente_user_id = auth.uid())
        or (p_papel is distinct from 'cliente' and pr.user_id = auth.uid())
      )
  );
$$;
revoke all on function public.usuario_tem_papel_no_projeto(uuid, text) from public, anon;
grant execute on function public.usuario_tem_papel_no_projeto(uuid, text) to authenticated;

-- 1) denuncias
drop policy if exists "denuncias_select_admin" on public.denuncias;
drop policy if exists "denuncias_update_admin" on public.denuncias;
drop policy if exists "usuarios autenticados podem denunciar" on public.denuncias;
drop policy if exists "Usuários autenticados criam denúncias" on public.denuncias;
create policy "denuncias_select_admin" on public.denuncias for select to authenticated using ((select public.is_admin()));
create policy "denuncias_update_admin" on public.denuncias for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()) and status = any (array['aberta','resolvida','arquivada']));

-- 2) portfolio_comentarios
drop policy if exists "Acesso total via Token" on public.portfolio_comentarios;
create policy "comentarios_participantes_leem" on public.portfolio_comentarios for select to authenticated
  using (public.usuario_tem_papel_no_projeto(projeto_id));
create policy "comentarios_participantes_inserem" on public.portfolio_comentarios for insert to authenticated
  with check (
    autor_tipo in ('cliente', 'prestador')
    and public.usuario_tem_papel_no_projeto(projeto_id, autor_tipo)
    and exists (select 1 from public.portfolio_fotos f where f.id = foto_id and f.projeto_id = portfolio_comentarios.projeto_id)
  );
revoke all on public.portfolio_comentarios from anon;
revoke all on public.portfolio_comentarios from authenticated;
grant select, insert on public.portfolio_comentarios to authenticated;

-- 3) projeto_mensagens
drop policy if exists "Permitir leitura para usuários autenticados" on public.projeto_mensagens;
drop policy if exists "Permitir inserção para usuários autenticados" on public.projeto_mensagens;
create policy "mensagens_participantes_leem" on public.projeto_mensagens for select to authenticated
  using (public.usuario_tem_papel_no_projeto(projeto_id));
create policy "mensagens_participantes_inserem" on public.projeto_mensagens for insert to authenticated
  with check (
    remetente_tipo in ('cliente', 'prestador')
    and public.usuario_tem_papel_no_projeto(projeto_id, remetente_tipo)
  );
revoke all on public.projeto_mensagens from anon;
revoke all on public.projeto_mensagens from authenticated;
grant select, insert on public.projeto_mensagens to authenticated;

-- 4) cidades / estados / regioes: só administrador altera
drop policy if exists "Admin pode inserir cidades" on public.cidades;
drop policy if exists "Admin pode atualizar cidades" on public.cidades;
drop policy if exists "Admin pode inserir estados" on public.estados;
drop policy if exists "Admin pode inserir regioes" on public.regioes;
create policy "Admin pode inserir cidades" on public.cidades for insert to authenticated with check ((select public.is_admin()));
create policy "Admin pode atualizar cidades" on public.cidades for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin pode inserir estados" on public.estados for insert to authenticated with check ((select public.is_admin()));
create policy "Admin pode inserir regioes" on public.regioes for insert to authenticated with check ((select public.is_admin()));

-- 5) permissões sem uso
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;
