-- supabase/homologacao/auditoria_seguranca.sql  (SÓ no banco de TESTE; nunca em supabase/migrations)
-- Auditor de segurança usado pelo E2E (tests/e2e/homologacao/auditoria-banco.spec.ts). Só lê o catálogo e devolve nomes.
-- Recusa rodar fora da homologação e só pode ser chamado por quem está logado (authenticated), não por visitante.
create or replace function public.e2e_auditar_seguranca()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if not exists (select 1 from public.ambiente_teste_marcador where nome = 'homologacao') then
    raise exception 'Este banco não é o de homologação: auditoria recusada.';
  end if;
  return jsonb_build_object(
    'sem_rls', coalesce((select jsonb_agg(c.relname order by c.relname) from pg_class c
       where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','p') and not c.relrowsecurity), '[]'::jsonb),
    'secdef_sem_search_path', coalesce((select jsonb_agg(p.proname order by p.proname) from pg_proc p
       where p.pronamespace = 'public'::regnamespace and p.prosecdef
         and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) x where x like 'search_path=%'))), '[]'::jsonb),
    'anon_executa', coalesce((select jsonb_agg(p.proname order by p.proname) from pg_proc p
       where p.pronamespace = 'public'::regnamespace and p.prosecdef and has_function_privilege('anon', p.oid, 'EXECUTE')), '[]'::jsonb),
    'anon_escreve', coalesce((select jsonb_agg(table_name || ':' || privilege_type order by table_name, privilege_type)
       from information_schema.role_table_grants
       where table_schema = 'public' and grantee = 'anon' and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')), '[]'::jsonb)
  );
end; $function$;
revoke all on function public.e2e_auditar_seguranca() from public, anon;
grant execute on function public.e2e_auditar_seguranca() to authenticated;
