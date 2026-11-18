-- Perfil de exemplo (divulgação): uma conta de demonstração com vários trabalhos, acessível só por link.
-- `exemplo = true` esconde o perfil da busca, das listas por categoria, do sitemap e do Google (noindex),
-- e mostra a faixa "Perfil de exemplo" no topo. Só o admin liga/desliga: o gatilho de proteção do dono
-- passa a ignorar mudanças nessa coluna (mesma regra de `verificado` e `bloqueado`).

alter table public.prestadores add column if not exists exemplo boolean not null default false;

create or replace function public.prestadores_proteger_campos()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  -- Cadastro básico entra no ar sem aprovação manual (doc 19: revisão humana só onde há
  -- julgamento — selos, denúncias, bloqueio). O dono só escolhe entre rascunho ('pendente')
  -- e no ar ('ativo'); qualquer outro valor é ignorado.
  if new.status is distinct from 'ativo' and new.status is distinct from 'pendente' then
    new.status := case when tg_op = 'UPDATE' then old.status else 'pendente' end;
  end if;

  if tg_op = 'INSERT' then
    new.verificado       := false;
    new.bloqueado        := false;
    new.exemplo          := false;
    new.cliques_whatsapp := 0;
    new.aprovado_em      := case when new.status = 'ativo' then now() else null end;
  else
    -- Um status especial definido pelo admin (se um dia existir) não pode ser desfeito pelo dono
    if old.status not in ('pendente', 'ativo') then
      new.status := old.status;
    end if;

    new.verificado       := old.verificado;
    new.bloqueado        := old.bloqueado;
    new.exemplo          := old.exemplo;
    new.cliques_whatsapp := old.cliques_whatsapp;
    -- A primeira entrada no ar fica registrada e não é reescrita
    new.aprovado_em      := coalesce(old.aprovado_em, case when new.status = 'ativo' then now() end);
  end if;

  return new;
end
$function$;
