-- Instagram vazio vira NULL no banco.
--
-- A constraint prestadores_instagram_formato (20261119180000) aceita NULL ou um usuário válido, mas não
-- texto vazio. O formulário de cadastro enviava '' (valor inicial do campo, que nem aparece nessa tela),
-- então todo cadastro novo falhava com "violates check constraint prestadores_instagram_formato".
-- A correção principal está no app (instagramParaGravar); este gatilho é a rede de segurança no banco:
-- vazio ou só espaços viram NULL antes da constraint ser checada.

create or replace function public.prestadores_instagram_vazio_vira_nulo()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.instagram is not null and btrim(new.instagram) = '' then
    new.instagram := null;
  end if;
  return new;
end;
$function$;

drop trigger if exists prestadores_instagram_vazio on public.prestadores;
create trigger prestadores_instagram_vazio
  before insert or update of instagram on public.prestadores
  for each row execute function public.prestadores_instagram_vazio_vira_nulo();
