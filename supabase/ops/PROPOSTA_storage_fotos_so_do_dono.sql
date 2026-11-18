-- PROPOSTA (não aplicada, fora de supabase/migrations de propósito): fotos só do dono.
-- Motivo (conferido em produção em 18/11/2026): no bucket `fotos-perfil` qualquer pessoa logada
-- pode ATUALIZAR e APAGAR qualquer arquivo (as políticas só olham o bucket, não o dono), e qualquer
-- visitante sem login pode ENVIAR arquivos ("Upload Público"). No bucket `portfolios` qualquer
-- pessoa logada pode ATUALIZAR (sobrescrever) qualquer arquivo. Como as URLs são públicas, o caminho
-- de qualquer foto é conhecido.
-- Só aplicar com o "pode seguir" do dono; testar antes no banco de teste e rodar o E2E.
-- Os nomes das políticas abaixo são os de produção; `if exists` evita erro se algum não existir.

drop policy if exists "Upload Público" on storage.objects;
drop policy if exists "Usuários podem subir suas fotos" on storage.objects;
drop policy if exists "bucket-fotos-perfil nz2uei_2" on storage.objects;
drop policy if exists "bucket-fotos-perfil nz2uei_3" on storage.objects;
drop policy if exists "Dono pode atualizar sua foto" on storage.objects;

-- Quem envia o arquivo vira `owner_id` automaticamente; só o dono altera ou apaga.
create policy "fotos_perfil_dono_atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'fotos-perfil' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'fotos-perfil' and owner_id = (select auth.uid())::text);

create policy "fotos_perfil_dono_apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-perfil' and owner_id = (select auth.uid())::text);

create policy "portfolios_dono_atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'portfolios' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'portfolios' and owner_id = (select auth.uid())::text);

-- Mantidas: INSERT para logados em fotos-perfil e portfolios; leitura pública dos buckets públicos.
-- Atenção: fotos antigas sem dono (importadas) deixam de ser editáveis/apagáveis por usuários (só pelo servidor/admin).
