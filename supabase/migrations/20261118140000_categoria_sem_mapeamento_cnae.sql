-- Honestidade no selo "Atividade compatível": quando não sabemos qual CNAE combina com a categoria do
-- perfil (categoria sem nenhuma linha em cnae_categorias), o painel do prestador diz isso e convida a
-- pessoa a nos ajudar, em vez de afirmar que a atividade "não combina". Só devolve um verdadeiro/falso;
-- não expõe a tabela de mapeamento (que continua sem acesso direto do navegador).
create or replace function public.categoria_sem_mapeamento_cnae(p_prestador_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.prestadores p
     where p.id = p_prestador_id
       and p.categoria_id is not null
       and not exists (select 1 from public.cnae_categorias m where m.categoria_id = p.categoria_id)
  );
$$;
revoke all on function public.categoria_sem_mapeamento_cnae(bigint) from public;
grant execute on function public.categoria_sem_mapeamento_cnae(bigint) to authenticated;
