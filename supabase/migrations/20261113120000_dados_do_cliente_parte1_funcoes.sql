-- Dados do cliente do projeto (nome e WhatsApp) como dado pessoal — parte 1/2, ADITIVA.
--
-- Problema: `portfolio_projetos` tinha leitura pública e os privilégios por coluna liberavam
-- `cliente_whatsapp` e `cliente_nome` para anon e authenticated. Qualquer visitante (ou qualquer
-- conta recém-criada) conseguia listar nome e telefone dos clientes de todos os prestadores.
--
-- Esta parte só ADICIONA o caminho controlado (mesmo padrão de `tokens_projetos`):
--   - `dados_cliente_projetos(ids)`        → nome/WhatsApp só para o prestador dono e o cliente vinculado;
--   - `nome_cliente_por_token(token)`      → nome para o cabeçalho das telas do cliente, por quem tem o link;
--   - `projetos_do_prestador_por_telefone` → checagem de cliente repetido, só para o prestador dono;
--   - `anonimizar_meus_dados_de_cliente()` → apaga nome e telefone dos projetos da conta que se exclui;
--   - `cliente_whatsapp` passa a aceitar nulo (cliente opcional no primeiro trabalho e apagamento LGPD).
-- A parte 2 (fechar a leitura direta das colunas) só deve ser aplicada DEPOIS que o app que usa
-- estas funções estiver no ar.

alter table public.portfolio_projetos alter column cliente_whatsapp drop not null;

create or replace function public.dados_cliente_projetos(p_ids uuid[])
returns table(projeto_id uuid, cliente_whatsapp text, cliente_nome text)
language sql stable security definer
set search_path to 'public'
as $function$
  select pp.id, pp.cliente_whatsapp, pp.cliente_nome
    from public.portfolio_projetos pp
    left join public.prestadores pr on pr.id = pp.prestador_id
   where auth.uid() is not null and pp.id = any (p_ids)
     and (pp.cliente_user_id = auth.uid() or pr.user_id = auth.uid());
$function$;

create or replace function public.nome_cliente_por_token(p_token text)
returns text
language plpgsql stable security definer
set search_path to 'public'
as $function$
declare v_token uuid; v_nome text;
begin
  if auth.uid() is null then return null; end if;
  begin v_token := p_token::uuid; exception when invalid_text_representation then return null; end;
  select cliente_nome into v_nome from public.portfolio_projetos where avaliacao_token = v_token;
  return v_nome;
end; $function$;

create or replace function public.projetos_do_prestador_por_telefone(p_prestador_id bigint, p_whatsapp text)
returns table(id uuid, titulo text, status text, cliente_nome text, created_at timestamptz)
language sql stable security definer
set search_path to 'public'
as $function$
  select pp.id, pp.titulo, pp.status, pp.cliente_nome, pp.created_at
    from public.portfolio_projetos pp
    join public.prestadores pr on pr.id = pp.prestador_id
   where auth.uid() is not null and pr.user_id = auth.uid()
     and pp.prestador_id = p_prestador_id and pp.cliente_whatsapp = p_whatsapp
   order by pp.created_at desc;
$function$;

create or replace function public.anonimizar_meus_dados_de_cliente()
returns integer
language plpgsql security definer
set search_path to 'public'
as $function$
declare v_n integer;
begin
  if auth.uid() is null then return 0; end if;
  update public.portfolio_projetos
     set cliente_nome = 'Cliente removido', cliente_whatsapp = null
   where cliente_user_id = auth.uid();
  get diagnostics v_n = row_count;
  return v_n;
end; $function$;

revoke all on function public.dados_cliente_projetos(uuid[]) from public, anon;
revoke all on function public.nome_cliente_por_token(text) from public, anon;
revoke all on function public.projetos_do_prestador_por_telefone(bigint, text) from public, anon;
revoke all on function public.anonimizar_meus_dados_de_cliente() from public, anon;
grant execute on function public.dados_cliente_projetos(uuid[]) to authenticated, service_role;
grant execute on function public.nome_cliente_por_token(text) to authenticated, service_role;
grant execute on function public.projetos_do_prestador_por_telefone(bigint, text) to authenticated, service_role;
grant execute on function public.anonimizar_meus_dados_de_cliente() to authenticated, service_role;
