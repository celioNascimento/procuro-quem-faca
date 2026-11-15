-- Reverte 20261115100000_garantia_funcoes_seguras.sql (volta ao estado anterior, INSEGURO: use só em emergência).
-- Não roda sozinho: fica fora de supabase/migrations de propósito.

revoke select (id, projeto_id, status, origem, tipo, descricao_problema, resposta_prestador_garantia,
               resolucao_descricao, nota_resultante) on public.solicitacoes_garantia from anon;
grant all on public.solicitacoes_garantia to anon, authenticated;
grant update on public.garantia_fotos to anon, authenticated;

create policy solicitacoes_garantia_insert on public.solicitacoes_garantia for insert to public
  with check (
    (origem = 'cliente' and cliente_user_id = auth.uid())
    or (origem = 'prestador' and exists (select 1 from prestadores p where p.id = solicitacoes_garantia.prestador_id and p.user_id = auth.uid()))
  );
create policy solicitacoes_garantia_update on public.solicitacoes_garantia for update to public
  using (
    cliente_user_id = auth.uid()
    or exists (select 1 from prestadores p where p.id = solicitacoes_garantia.prestador_id and p.user_id = auth.uid())
  );

create policy garantia_fotos_insert on public.garantia_fotos for insert to public
  with check (exists (select 1 from solicitacoes_garantia sg left join prestadores p on p.id = sg.prestador_id
    where sg.id = garantia_fotos.caso_id and (sg.cliente_user_id = auth.uid() or p.user_id = auth.uid())));
create policy garantia_fotos_select on public.garantia_fotos for select to public
  using ((exists (select 1 from solicitacoes_garantia sg left join prestadores p on p.id = sg.prestador_id
    where sg.id = garantia_fotos.caso_id and (sg.cliente_user_id = auth.uid() or p.user_id = auth.uid())))
    or (exists (select 1 from perfis_admin pa where pa.user_id = auth.uid() and pa.role = any (array['owner','moderator']))));
create policy garantia_fotos_update on public.garantia_fotos for update to public
  using (exists (select 1 from solicitacoes_garantia sg left join prestadores p on p.id = sg.prestador_id
    where sg.id = garantia_fotos.caso_id and (sg.cliente_user_id = auth.uid() or p.user_id = auth.uid())));
create policy garantia_comentarios_insert on public.garantia_comentarios for insert to public
  with check (exists (select 1 from solicitacoes_garantia sg left join prestadores p on p.id = sg.prestador_id
    where sg.id = garantia_comentarios.caso_id and (sg.cliente_user_id = auth.uid() or p.user_id = auth.uid())));
create policy garantia_comentarios_select on public.garantia_comentarios for select to public
  using ((exists (select 1 from solicitacoes_garantia sg left join prestadores p on p.id = sg.prestador_id
    where sg.id = garantia_comentarios.caso_id and (sg.cliente_user_id = auth.uid() or p.user_id = auth.uid())))
    or (exists (select 1 from perfis_admin pa where pa.user_id = auth.uid() and pa.role = any (array['owner','moderator']))));

drop policy if exists insercao_garantia_fotos_dono_do_caso on public.garantia_fotos;
create policy insercao_garantia_fotos_dono_do_caso on public.garantia_fotos for insert to authenticated
  with check (usuario_tem_acesso_ao_caso_garantia(caso_id));

drop function if exists public.garantia_processar_vencidos();
drop function if exists public.garantia_reabrir(uuid);
drop function if exists public.garantia_confirmar_resolucao(uuid, text, text[], integer);
drop function if exists public.garantia_responder(uuid, text);
drop function if exists public.garantia_recusar_oferta(uuid);
drop function if exists public.garantia_aceitar_oferta(uuid);
drop function if exists public.garantia_oferecer_reparo(uuid, text);
drop function if exists public.garantia_abrir_caso(uuid, text);
drop function if exists public.garantia_prazo_uteis(integer);
drop index if exists public.uq_solicitacoes_garantia_um_ativo_por_projeto;
