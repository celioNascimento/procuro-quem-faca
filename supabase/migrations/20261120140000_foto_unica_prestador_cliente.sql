-- Perfil de cliente nasce junto com o de prestador, e os dois usam a MESMA foto.
--
-- Decisões do dono (20/11/2026):
--   - Quando o perfil de prestador entra no ar (status 'ativo'), o perfil de cliente (profiles) é criado/completado
--     com o NOME e a FOTO. O resto (WhatsApp, endereço) a pessoa preenche quando quiser.
--   - Trocar a foto em um lugar troca nos dois; a foto de cliente continua opcional.
--
-- Regras:
--   prestadores -> profiles : nome (só se o cliente ainda não tem nome; nunca sobrescreve) e foto (sempre acompanha o prestador).
--                             Se a pessoa ainda não tem linha em profiles, ela é criada com role 'prestador'.
--   profiles -> prestadores : só a foto, e só quando foi ENVIADA ao PQF (bucket fotos-perfil). Foto do Google nunca
--                             sobrescreve a do prestador.
-- Só vale para perfil de prestador no ar ('ativo'); rascunho ('pendente') não mexe no cliente.
-- Sem laço: cada gatilho só grava quando o valor do outro lado é diferente.
-- Os dois perfis usam o mesmo bucket (fotos-perfil) e as exclusões de conta apagam prestador e cliente juntos,
-- então o arquivo compartilhado não fica apontado por um perfil que continua existindo.

create or replace function public.sincronizar_foto_do_prestador_para_cliente()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status = 'ativo' and new.user_id is not null then
    insert into public.profiles as p (id, full_name, avatar_url, role, updated_at)
    values (
      new.user_id,
      nullif(btrim(new.nome), ''),
      nullif(btrim(new.foto_perfil), ''),
      'prestador',
      now()
    )
    on conflict (id) do update
      set avatar_url = coalesce(excluded.avatar_url, p.avatar_url),
          full_name  = case when coalesce(btrim(p.full_name), '') = '' then excluded.full_name else p.full_name end,
          updated_at = now()
      where p.avatar_url is distinct from coalesce(excluded.avatar_url, p.avatar_url)
         or (coalesce(btrim(p.full_name), '') = '' and excluded.full_name is not null);
  end if;
  return new;
end;
$function$;

create or replace function public.sincronizar_foto_do_cliente_para_prestador()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.avatar_url is not null and new.avatar_url like '%/object/public/fotos-perfil/%' then
    update public.prestadores
       set foto_perfil = new.avatar_url
     where user_id = new.id
       and status = 'ativo'
       and foto_perfil is distinct from new.avatar_url;
  end if;
  return new;
end;
$function$;

revoke all on function public.sincronizar_foto_do_prestador_para_cliente() from public, anon, authenticated;
revoke all on function public.sincronizar_foto_do_cliente_para_prestador() from public, anon, authenticated;

drop trigger if exists prestadores_foto_para_cliente on public.prestadores;
create trigger prestadores_foto_para_cliente
  after insert or update of foto_perfil, user_id, nome, status on public.prestadores
  for each row execute function public.sincronizar_foto_do_prestador_para_cliente();

drop trigger if exists profiles_foto_para_prestador on public.profiles;
create trigger profiles_foto_para_prestador
  after update of avatar_url on public.profiles
  for each row execute function public.sincronizar_foto_do_cliente_para_prestador();

-- Quem já tem perfil de prestador no ar: cria/completa o perfil de cliente com nome e foto (mesma regra dos gatilhos).
insert into public.profiles as p (id, full_name, avatar_url, role, updated_at)
select distinct on (pr.user_id) pr.user_id, nullif(btrim(pr.nome), ''), nullif(btrim(pr.foto_perfil), ''), 'prestador', now()
  from public.prestadores pr
 where pr.status = 'ativo' and pr.user_id is not null
 order by pr.user_id, pr.created_at desc
on conflict (id) do update
  set avatar_url = coalesce(excluded.avatar_url, p.avatar_url),
      full_name  = case when coalesce(btrim(p.full_name), '') = '' then excluded.full_name else p.full_name end,
      updated_at = now()
  where p.avatar_url is distinct from coalesce(excluded.avatar_url, p.avatar_url)
     or (coalesce(btrim(p.full_name), '') = '' and excluded.full_name is not null);
