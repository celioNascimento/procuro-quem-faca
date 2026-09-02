-- Sessão de fotos editável na vitrine pública do prestador
alter table public.prestadores
  add column if not exists sessao_fotos_titulo text,
  add column if not exists sessao_fotos_urls text[] not null default '{}'::text[];

alter table public.prestadores
  add constraint prestadores_sessao_fotos_urls_limite
  check (cardinality(sessao_fotos_urls) <= 5);

comment on column public.prestadores.sessao_fotos_titulo is 'Nome personalizado da sessão de fotos pública';
comment on column public.prestadores.sessao_fotos_urls is 'Até cinco URLs públicas das fotos da sessão';
