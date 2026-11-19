-- Segurança (auditoria de 18/11/2026). Quatro correções independentes, todas só de permissão:
--  1. Fotos (storage): só o dono altera/apaga; visitante sem login não envia.
--  2. Tabela legada `perfis` (sem uso no app): fecha leitura e gravação diretas.
--  3. `logs_atividades`: 3 políticas públicas duplicadas viram 1; leitura do admin passa a usar is_admin()
--     (antes dependia de um e-mail provisório que nunca existiu).
--  4. `anon` só grava onde precisa (denuncias, visitas_perfil, logs_atividades, só INSERT).
-- As funções SECURITY DEFINER (ex.: exportar_meus_dados) continuam lendo `perfis`.

-- 1. Fotos -----------------------------------------------------------------------------------------
drop policy if exists "Upload Público" on storage.objects;
drop policy if exists "Usuários podem subir suas fotos" on storage.objects;
drop policy if exists "bucket-fotos-perfil nz2uei_2" on storage.objects;
drop policy if exists "bucket-fotos-perfil nz2uei_3" on storage.objects;
drop policy if exists "Dono pode atualizar sua foto" on storage.objects;
drop policy if exists "fotos_perfil_dono_atualiza" on storage.objects;
drop policy if exists "fotos_perfil_dono_apaga" on storage.objects;
drop policy if exists "portfolios_dono_atualiza" on storage.objects;

create policy "fotos_perfil_dono_atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'fotos-perfil' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'fotos-perfil' and owner_id = (select auth.uid())::text);

create policy "fotos_perfil_dono_apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-perfil' and owner_id = (select auth.uid())::text);

create policy "portfolios_dono_atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'portfolios' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'portfolios' and owner_id = (select auth.uid())::text);

-- 2. Tabela legada perfis -----------------------------------------------------------------------------
drop policy if exists "Perfis são públicos" on public.perfis;
drop policy if exists "Perfis são visíveis para todos" on public.perfis;
drop policy if exists "Perfis visíveis para todos" on public.perfis;
revoke all on public.perfis from anon, authenticated;

-- 3. logs_atividades ----------------------------------------------------------------------------------
drop policy if exists "Permitir inserção de logs pública" on public.logs_atividades;
drop policy if exists "Public Log Insert" on public.logs_atividades;
drop policy if exists "Qualquer um pode inserir logs" on public.logs_atividades;
drop policy if exists "logs_inserir" on public.logs_atividades;
create policy "logs_inserir" on public.logs_atividades for insert to anon, authenticated with check (true);

drop policy if exists "Admins podem ler logs" on public.logs_atividades;
drop policy if exists "logs_admin_le" on public.logs_atividades;
create policy "logs_admin_le" on public.logs_atividades for select to authenticated using ((select public.is_admin()));

-- 4. anon só grava onde precisa -----------------------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p')
  loop
    if t.relname in ('denuncias', 'visitas_perfil', 'logs_atividades') then
      execute format('revoke update, delete, truncate on public.%I from anon', t.relname);
    else
      execute format('revoke insert, update, delete, truncate on public.%I from anon', t.relname);
    end if;
  end loop;
end $$;
