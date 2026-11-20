-- Foto única: quem tem conta de prestador e de cliente usa a MESMA foto nos dois perfis.
--
-- Decisão do dono (20/11/2026): trocar a foto em um lugar troca nos dois; a foto de cliente continua opcional.
--   prestadores.foto_perfil  -> profiles.avatar_url   sempre que a foto do prestador muda;
--   profiles.avatar_url      -> prestadores.foto_perfil só quando a nova foto foi ENVIADA ao PQF (bucket fotos-perfil).
-- Foto vinda do Google (user_metadata) nunca sobrescreve a foto do prestador.
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
  if new.user_id is not null and new.foto_perfil is not null and btrim(new.foto_perfil) <> '' then
    update public.profiles
       set avatar_url = new.foto_perfil,
           updated_at = now()
     where id = new.user_id
       and avatar_url is distinct from new.foto_perfil;
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
       and foto_perfil is distinct from new.avatar_url;
  end if;
  return new;
end;
$function$;

revoke all on function public.sincronizar_foto_do_prestador_para_cliente() from public, anon, authenticated;
revoke all on function public.sincronizar_foto_do_cliente_para_prestador() from public, anon, authenticated;

drop trigger if exists prestadores_foto_para_cliente on public.prestadores;
create trigger prestadores_foto_para_cliente
  after insert or update of foto_perfil, user_id on public.prestadores
  for each row execute function public.sincronizar_foto_do_prestador_para_cliente();

drop trigger if exists profiles_foto_para_prestador on public.profiles;
create trigger profiles_foto_para_prestador
  after update of avatar_url on public.profiles
  for each row execute function public.sincronizar_foto_do_cliente_para_prestador();

-- Quem já tem os dois perfis: a foto do prestador vale para o cliente.
update public.profiles p
   set avatar_url = pr.foto_perfil,
       updated_at = now()
  from public.prestadores pr
 where pr.user_id = p.id
   and pr.foto_perfil is not null
   and btrim(pr.foto_perfil) <> ''
   and p.avatar_url is distinct from pr.foto_perfil;
