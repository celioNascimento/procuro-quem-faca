-- Cadastro básico entra no ar sem aprovação manual.
--
-- Antes, o gatilho forçava todo cadastro de prestador a nascer 'pendente' e impedia o próprio
-- dono de ativá-lo — mas não existia nenhuma tela de aprovação, então todo cadastro novo ficava
-- invisível para sempre. Pelo princípio do plano de confiança (doc 19), a revisão humana fica
-- onde há julgamento (selos, denúncias, bloqueio); o cadastro básico é automático.
--
-- O que muda para o dono do perfil (admins continuam podendo tudo):
--   - status: só 'pendente' (rascunho) ou 'ativo' (no ar); qualquer outro valor é ignorado e um
--     status especial definido por admin não pode ser desfeito pelo dono;
--   - aprovado_em: marcado na primeira vez em que o perfil entra no ar, e nunca reescrito;
--   - verificado, bloqueado e cliques_whatsapp continuam protegidos como antes.
-- Aplicado no banco em 13/11/2026.

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
    new.cliques_whatsapp := 0;
    new.aprovado_em      := case when new.status = 'ativo' then now() else null end;
  else
    -- Um status especial definido pelo admin (se um dia existir) não pode ser desfeito pelo dono
    if old.status not in ('pendente', 'ativo') then
      new.status := old.status;
    end if;

    new.verificado       := old.verificado;
    new.bloqueado        := old.bloqueado;
    new.cliques_whatsapp := old.cliques_whatsapp;
    -- A primeira entrada no ar fica registrada e não é reescrita
    new.aprovado_em      := coalesce(old.aprovado_em, case when new.status = 'ativo' then now() end);
  end if;

  return new;
end
$function$;
