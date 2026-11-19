-- Instagram do prestador (opcional, público no perfil). Guarda SÓ o nome de usuário, sem @ e sem link:
-- o endereço é montado pelo app (instagram.com/<usuario>), então ninguém consegue publicar outro destino.
-- Mesma regra de lib/instagram.ts: 1 a 30 letras minúsculas, números, ponto e sublinhado; sem ponto no fim
-- nem dois pontos seguidos. A exportação de dados (exportar_meus_dados) já inclui a linha inteira do
-- prestador (to_jsonb), e a exclusão da conta apaga a linha, então o campo entra nos dois sem mudança.
alter table public.prestadores add column if not exists instagram text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'prestadores_instagram_formato') then
    alter table public.prestadores add constraint prestadores_instagram_formato
      check (instagram is null or (instagram ~ '^[a-z0-9_]([a-z0-9._]{0,28}[a-z0-9_])?$' and instagram !~ '\.\.'));
  end if;
end $$;

comment on column public.prestadores.instagram is 'Usuário do Instagram (sem @), opcional e público no perfil.';
