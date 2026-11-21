-- is_admin() passa a exigir a verificação em duas etapas quando a conta tem um aplicativo cadastrado.
-- Quem tem fator verificado só é admin com a sessão no nível aal2 (código já digitado). Quem não tem fator
-- cadastrado continua como antes. Cobre as políticas e funções do banco que usam is_admin().
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1 from public.perfis_admin where user_id = (select auth.uid())
  )
  and (
    coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
       where f.user_id = (select auth.uid()) and f.status = 'verified'
    )
  );
$function$;
