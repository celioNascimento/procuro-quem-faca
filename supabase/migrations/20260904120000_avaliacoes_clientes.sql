create table if not exists public.avaliacoes_clientes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.portfolio_projetos(id) on delete cascade,
  prestador_id bigint not null references public.prestadores(id) on delete cascade,
  cliente_user_id uuid not null references auth.users(id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  motivos text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (projeto_id),
  check (coalesce(array_length(motivos, 1), 0) <= 3)
);
create index if not exists avaliacoes_clientes_prestador_idx on public.avaliacoes_clientes(prestador_id, created_at desc);
alter table public.avaliacoes_clientes enable row level security;
create policy "prestador vê avaliações de seus clientes" on public.avaliacoes_clientes for select to authenticated using (exists (select 1 from public.prestadores p where p.id = prestador_id and p.user_id = (select auth.uid())));
create policy "cliente vê sua avaliação" on public.avaliacoes_clientes for select to authenticated using (cliente_user_id = (select auth.uid()));
create policy "prestador cria avaliação do projeto" on public.avaliacoes_clientes for insert to authenticated with check (exists (select 1 from public.prestadores p join public.portfolio_projetos pr on pr.prestador_id = p.id where p.id = prestador_id and p.user_id = (select auth.uid()) and pr.id = projeto_id and pr.cliente_user_id = cliente_user_id and pr.status = 'finalizado'));

grant select, insert on public.avaliacoes_clientes to authenticated;
