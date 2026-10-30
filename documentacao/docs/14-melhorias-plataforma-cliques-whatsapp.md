# Melhorias da plataforma — navegação, fluidez, qualidade e cliques de WhatsApp

Avaliação feita em 25/10/2026 a partir do histórico de commits (até o PR #115, de 24/10) e da leitura do código atual. Testes, lint e build **não foram executados** nesta avaliação; as conclusões vêm só da leitura do código.

## 1. O que já está registrado nos commits

### Cliques de WhatsApp

| Data | Commit / PR | O que mudou |
|---|---|---|
| 15/10 | `8870f36` (#104) | Primeira gravação do clique. Gravava na tabela errada; corrigido no mesmo dia. |
| 15/10 | `4567569`, `dd74f99` (#105) | Rota `/api/prestadores/clique-whatsapp` e uso da chave admin do Supabase. |
| 16/10 | `5fa8ebe` (#107) | O rastreamento deixou de bloquear a abertura do WhatsApp. |
| 22/10 | `5f1f24d` (#108) | **Tarefa 3.** A rota estava numa versão antiga porque os arquivos de apoio (`lib/tracking/*` e os services) nunca foram commitados e se perderam num `git reset --hard`. Recriados com as regras abaixo. |
| 23/10 | `5195d86` (#109) | **Tarefa 4.** O proxy grava o cookie `pqf_origem` no primeiro toque com `utm_source` (ou `src`), válido por 90 dias. |
| 23/10 | `ff32c98` (#110) | `scripts/smoke.mjs` passa a validar o cookie. |
| 23/10 | `17ac472` (#111) | Corrige a dupla codificação do cookie `pqf_origem`. |

Regras aplicadas hoje na rota (Tarefa 3):

- ignora robôs, pelo user-agent;
- ignora o clique do próprio prestador logado;
- conta no máximo 1 clique por sessão e prestador a cada 24h;
- grava origem e campanha, vindas do cookie, do referer ou `direto`;
- no modo `amostra`, só registra prestadores da tabela `rastreio_amostra`.

### Navegação e fluidez (setembro)

- Skeletons sem pulos e correção de skeleton infinito em "meus serviços" e no perfil público.
- `Suspense` no painel do cliente e nos parâmetros de busca da ajuda.
- Restauração de scroll ao trocar de rota e ao abrir o wizard.
- Redirects do dashboard (perfil duplo) e do logout do admin.
- Filtros de região e cidade na busca, e sitemap dinâmico.

### Qualidade

- 26 testes unitários em `lib/tracking`.
- `scripts/smoke.mjs`, com opção `--writes` para testar o registro de cliques.
- Refatoração do `MetricasAnuncios` para service e hook (#115).

## 2. Pendências e problemas encontrados

1. **Tabelas do rastreio fora do controle de versão.** `cliques`, `rastreio_config` e `rastreio_amostra` não existem em `supabase/migrations`. O commit da Tarefa 3 diz que estão no banco real. Um ambiente novo ou de homologação ficaria sem elas, e a rota responderia ok sem registrar nada (`rastreioAtivoPara` devolve `false` quando a consulta falha).
2. **Modo amostra provavelmente ativo.** Qualquer valor diferente de `todos` em `rastreio_config` é tratado como `amostra`. Enquanto não for `todos`, só os prestadores de `rastreio_amostra` são contados. Conferir o valor atual no banco.
3. **Clique pode se perder no celular.** O `fetch` em `PerfilPublicoClient.tsx` não usa `keepalive`, e o `wa.me` abre o app do WhatsApp, o que pode suspender a página antes de a requisição terminar.
4. **Duas contagens divergentes.** Todo clique também grava o log `CLIQUE_WHATSAPP_ORCAMENTO` pelo navegador (`insertLog`), ignorando dedupe, amostra e dono do perfil. O log de auditoria do admin não bate com a tabela `cliques`. Além disso, se a API falhar, o log nem é gravado.
5. **Cliques gravados, mas sem tela.** Não foi encontrado, em `app`, `components`, `hooks` e `lib`, nenhum ponto que leia a tabela `cliques`. A coluna antiga `prestadores.cliques_whatsapp` não é mais incrementada nem lida. Views ou RPCs do Supabase não foram verificadas.
6. **Contatos por WhatsApp sem rastreio.** O botão de `ServicoCard` (meus serviços) e o de `CardPrestador` (acompanhamento) abrem o WhatsApp do prestador sem registrar nada. Só o `PerfilCTA` do perfil público registra. Decisão pendente: esses cliques contam como orçamento?
7. **Proxy em todas as páginas públicas.** Desde a Tarefa 4 o `proxy.ts` roda em quase todas as rotas. Ele só lê o cookie, sem consultar o Supabase, então o custo é baixo; acompanhar no Speed Insights.
8. **Sobras menores.** 13 `console` com `[v0]` no código, e a pendência do roadmap de revisar os pontos que montam o link de WhatsApp manualmente.
9. **Lição de teste.** Os testes unitários do cookie não pegaram a dupla codificação porque liam o valor em memória. Testes de cookie devem ler o cabeçalho `Set-Cookie` real, como o `smoke.mjs` faz.
10. **Qualquer pessoa pode inserir cliques direto pela API pública.** Em produção, a política `Qualquer um pode registrar um clique` em `cliques` permite `INSERT` para `public` com `with check (true)`. Quem tiver a chave pública do Supabase pode gravar cliques sem passar pelas regras da rota (robôs, dedupe de 24h, amostra) e inflar a contagem. A rota usa o cliente administrativo, que ignora o RLS, então a política parece desnecessária; antes de remover, confirmar que nada mais insere em `cliques` pelo cliente público.

## 3. Ordem de correção proposta

1. Conferir `rastreio_config` no banco e criar a migration das três tabelas.
2. Adicionar `keepalive` ao `fetch` e unificar o log com a regra da rota: a rota devolve `contado` e o log só é gravado quando for `true`.
3. Mostrar os cliques da tabela `cliques` no painel do prestador e no admin.
4. Decidir se `ServicoCard` e `CardPrestador` entram no rastreio.
5. Remover os `console` `[v0]` e rodar o `smoke.mjs --writes` após as mudanças.
6. Remover a política pública de `INSERT` em `cliques` (pendência 10), depois de confirmar que nada insere pelo cliente público.

## 4. Andamento

- [x] 1. Conferir modo e criar migration — modo confirmado como `amostra`; migration enviada (ver seção 5)
- [x] 2. `keepalive` e log unificado — código no PR `fix/rastreio-cliques-whatsapp`; falta validar no deploy de preview (ver seção 5)
- [x] 3. Exibir cliques nos painéis — código na branch `feat/passo3-cliques-paineis`; falta validar no deploy de preview (ver seção 5)
- [x] 4. Decidir rastreio dos demais botões — decidido: não rastrear (ver seção 5)
- [x] 5. Limpeza — `console` `[v0]` removidos (ver seção 5); `smoke.mjs --writes` revalidado em produção pelo Célio (11 passaram, 0 falharam, 1 pulado)
- [x] 6. Remover a política pública de `INSERT` em `cliques` — migration criada e aplicada em produção pelo Célio (ver seção 5)

**Frente encerrada em 28/10/2026** — os 6 passos estão concluídos e aplicados em produção. O modo do rastreio saiu de `amostra` para `todos` (ver seção 5, Passo 7); a partir daqui os cliques de WhatsApp são contados para todos os prestadores.

**Continuação (28 e 29/10/2026):**

- [x] 8. Versionar o SQL que existia só no banco (`perfis_admin`, `is_admin()`, `visitas_perfil`, FKs) — migrations aplicadas em produção em 28/10 (ver Passo 8)
- [x] 9. Visitas ao perfil gravadas pelo servidor — deploy, smoke, conferência no navegador e remoção da política pública de `INSERT` em `visitas_perfil` concluídos em produção (29/10; ver Passo 9)
- [ ] 10. Painel do prestador: card de visitas ao perfil (Fase 1 do planejamento) — código e testes prontos; falta aplicar a migration, fazer o deploy e conferir no painel (ver Passo 10)
- [ ] 11. Verificação automática no GitHub (testes, lint e tipos a cada push) — workflow pronto e simulado; falta commitar e ver a primeira execução no GitHub (ver Passo 11)

## 5. Registro por passo

### Passo 1 — Conferir o banco e versionar as tabelas (25/10/2026)

**O que foi conferido no banco de produção** (consultas executadas pelo Célio no SQL Editor; a sessão do Claude não tem acesso ao projeto do PQF, que fica em outra conta do Supabase):

- **Modo do rastreio: `amostra`** (`rastreio_config`, chave `modo`). `rastreio_amostra` tem **15 prestadores**. Ou seja, hoje só os cliques desses 15 são registrados; os de todos os outros prestadores são descartados pela rota, que responde ok.
- Índices em `cliques`: `cliques_pkey (id)`, `idx_cliques_prestador_data (prestador_id, created_at desc)` e `idx_cliques_origem_data (origem, created_at desc)`. `rastreio_amostra` e `rastreio_config` têm só a chave primária (`prestador_id` e `chave`).
- `cliques`: `id` (bigint, sem default visível, provavelmente identity), `prestador_id` (bigint), `created_at` (timestamptz, default `now()`), `origem`, `campanha` e `sessao_id` (text). Só `id` é `NOT NULL`.
- `rastreio_amostra`: `prestador_id` (bigint, `NOT NULL`), `observacao` (text), `criado_em` (timestamptz, default `now()`).
- `rastreio_config`: `chave` e `valor` (text, `NOT NULL`), `atualizado_em` (timestamptz, default `now()`).
- Políticas de `cliques`: admin lê tudo (`is_admin()`); prestador lê só os próprios; **qualquer pessoa pode inserir** (pendência 10). Não há políticas em `rastreio_config` nem em `rastreio_amostra`. O RLS está **ativo nas três tabelas** (confirmado), então só a chave administrativa acessa `rastreio_*`.
- Conteúdo de `cliques` em 25/10: 19 linhas com origem e campanha nulas e 8 linhas `meta` / `teste` (do `smoke.mjs --writes`). **Correção (27/10):** as 19 linhas nulas têm `sessao_id = 'backfill'` e datas de março a setembro; são registros históricos importados, e não da versão antiga da rota como foi afirmado antes.
- Os 8 registros de teste foram apagados (`delete from public.cliques where campanha = 'teste';`): a consulta dos últimos cliques em 27/10 não os mostra.

**O que foi feito:** a migration `supabase/migrations/20261025114000_rastreio_cliques_whatsapp.sql` (PR `fix/rastreio-cliques-whatsapp`) versiona as três tabelas com as colunas, chaves primárias e índices reais, mantém o RLS ativo e recria as três políticas existentes. É idempotente: em produção não muda nada. O valor inicial de `modo` é `amostra`, só quando a chave não existe.

**Conclusão sobre os cliques:** o modo `amostra` explica a falta de cliques reais nas métricas gerais.

**Validação em produção (27/10, 19h20 no horário de Brasília):** teste manual no perfil de um prestador da amostra (id 128, "W&A Manutenções e Reformas"). Entrou uma linha `origem = 'direto'`, `campanha` nula e `sessao_id` preenchido. Isso confirma que a rota nova (Tarefa 3) está publicada e grava corretamente. Desde 22/10 só existe esse clique real: dos 15 prestadores da amostra, 14 não receberam nenhum.

**Ainda não testado:** o dedupe de 24h (um segundo clique na mesma sessão e no mesmo prestador não deve gerar outra linha) e a origem por campanha (abrir o perfil com `?utm_source=meta&utm_campaign=teste` e conferir se o cookie `pqf_origem` é gravado e usado). Cliques de teste com campanha `teste` podem ser apagados depois com o `delete` acima.

**Decisão pendente (negócio):** quando encerrar o teste por amostra, mudar o modo para `todos`: `update public.rastreio_config set valor = 'todos', atualizado_em = now() where chave = 'modo';`. Isso é um ajuste de dados feito no banco, não faz parte da migration, e deve ser decidido pelo Célio.

**Pendências restantes do passo 1 (não bloqueiam o passo 2):**
- Versionar `is_admin()`, que não está em nenhuma migration do repositório. Sem ela, a política de leitura do admin não é criada em um ambiente novo. **Feito no Passo 8.**
- Conferir as chaves estrangeiras de `cliques.prestador_id` e `rastreio_amostra.prestador_id`. **Feito no Passo 8:** as duas (e a de `visitas_perfil`) são `ON DELETE CASCADE` para `prestadores(id)`.
- Aplicar a migration em um ambiente novo ou de homologação para validar.

### Passo 2 — Log no servidor e `keepalive` (27/10/2026)

**Decisão (Célio):** gravar o log de auditoria no servidor, e não no navegador.

**O que mudou** (PR `fix/rastreio-cliques-whatsapp`, commit original `94e7a4a`):
- `app/api/prestadores/clique-whatsapp/route.ts`: depois de gravar o clique, grava `CLIQUE_WHATSAPP_ORCAMENTO` em `logs_atividades` **só quando o clique é contado**. O log leva o nome do prestador, a origem, a campanha e, se houver sessão, o `usuario_id` e o `usuario_email`. Se o log falhar, o clique já está gravado e a rota responde normalmente (o erro vai para o `console.error`).
- `lib/services/cliques.service.ts`: nova função `inserirLogClique` e o nome do prestador na consulta `buscarPrestadorParaClique`.
- `app/(perfil)/[slug]/PerfilPublicoClient.tsx`: o `fetch` passa a usar `keepalive: true` e o `insertLog` do navegador foi removido.

**Efeitos a observar**
- O log de auditoria e a tabela `cliques` passam a ter a mesma contagem: robôs, dono do perfil, repetição em 24h e prestadores fora da amostra deixam de gerar log. Os logs antigos continuam na tabela e não batem com `cliques`; só valem os de antes de 22/10.
- A rota agora consulta o usuário logado em todo clique (antes, só quando o prestador tinha `user_id`). Para visitante sem sessão, não há chamada de rede ao Supabase Auth.
- Nos logs novos, `detalhes` ganha `origem` e `campanha`. A página `/admin/logs` continua mostrando só `nome_prestador`.

**Não validado nesta sessão:** lint, tipos (`tsc`) e testes não rodaram, porque o registro do npm não é acessível no ambiente de trabalho; os tipos foram conferidos só pela leitura. Não há teste automatizado da rota nem do service.

**Como validar no deploy de preview**
1. Abrir o perfil de um prestador da amostra, sem estar logado como dono, e clicar em "Solicitar Orçamento".
2. Conferir que entrou uma linha nova em `cliques` **e** uma linha `CLIQUE_WHATSAPP_ORCAMENTO` em `logs_atividades`:
   ```sql
   select created_at, acao, entidade_id, usuario_email, detalhes
   from public.logs_atividades
   where acao = 'CLIQUE_WHATSAPP_ORCAMENTO'
   order by created_at desc limit 5;
   ```
3. Clicar de novo no mesmo perfil: não deve entrar linha nova em nenhuma das duas tabelas (dedupe de 24h).
4. No celular, conferir se o clique é gravado mesmo com o WhatsApp abrindo na hora.

**Observação (não corrigida):** a verificação de dedupe e a gravação do clique não são atômicas. Dois cliques quase simultâneos da mesma sessão, por exemplo no botão do corpo da página e no botão flutuante, podem passar pela verificação ao mesmo tempo e gravar duas linhas. É raro e não foi tratado neste passo; a correção seria uma restrição única no banco.

### Passo 3 — Cliques no dashboard do prestador e no admin (27/10/2026)

**Decisão (Célio):** mostrar nos dois lugares. Branch `feat/passo3-cliques-paineis`, que parte da branch unificada `fix/rastreio-cliques-whatsapp`; abrir o PR depois que o PR do passo 1 e 2 for mergeado (ou apontar o PR para a branch unificada).

**Prestador** (`/dashboard`)
- Card "Pedidos de orçamento pelo WhatsApp" abaixo do anúncio, com cliques dos últimos 7 dias, dos últimos 30 dias e o total registrado (inclui os registros históricos importados).
- Rota `GET /api/prestadores/meus-cliques`: descobre o prestador pela sessão. Roda no servidor porque só ele sabe se o rastreio está ativo para aquele prestador. **Fora da amostra, o card mostra um aviso em vez de "0"**, para o prestador não achar que ninguém clicou.
- O card só aparece com cadastro completo e perfil não bloqueado.

**Admin** (`/admin/cliques`, link "Cliques WhatsApp" no menu, em Inteligência)
- Períodos de 7, 30 e 90 dias: total de cliques, pessoas diferentes (cookies de sessão distintos, sem os registros `backfill`), prestadores distintos, cliques por dia (dias de Brasília), origem e campanha, e ranking dos 10 prestadores.
- Aviso fixo com o modo do rastreio (`amostra` com N prestadores, ou `todos`), porque em `amostra` quem está fora não aparece e isso não quer dizer zero cliques.
- Rota `GET /api/admin/cliques`: exige admin (`perfis_admin`, como as outras rotas de `/api/admin`). Lê em páginas de 1000 linhas, que é o teto do Supabase por consulta, até 10 páginas; se passar disso, a página avisa que os números são parciais em vez de mostrar um total menor como se fosse completo.

**Correção encontrada no caminho:** o "Pulso ao vivo" da home do admin filtrava a ação `CLIQUE_WHATSAPP`, que nenhum ponto do código grava. A ação real é `CLIQUE_WHATSAPP_ORCAMENTO`. Por isso o painel nunca mostrou cliques de WhatsApp. Corrigido em `adminDashboard.service.ts` e na própria home.

**Verificação feita**
- `lib/tracking/resumo.ts` (a agregação, que concentra a lógica) tem 8 testes que passam, rodados com o executor de testes do Node e um adaptador mínimo no lugar do vitest, e compila em modo estrito (`tsc --strict`, saída 0).
- O `tsc` do projeto inteiro só acusa módulos e tipos do React ausentes no ambiente; nenhum erro de tipo nos arquivos alterados.

**Não verificado:** lint, `vitest` de verdade, build e as telas no navegador. As rotas e o card nunca foram executados contra o banco. O número a conferir primeiro é o do prestador 128, que tem 1 clique real desde 22/10.

**Como validar no deploy de preview**
1. Entrar como o dono do prestador 128, que está na amostra: o card deve mostrar 1 clique nos últimos 7 e 30 dias (mais os históricos no total).
2. Entrar como um prestador fora da amostra: o card deve mostrar o aviso de contagem não ativa, e não "0".
3. Entrar no admin e abrir `/admin/cliques`: o aviso deve dizer "modo amostra" com 15 prestadores, e o prestador 128 deve aparecer no ranking.
4. Na home do admin, depois de um clique de teste num perfil da amostra, o "Pulso ao vivo" deve mostrar "WhatsApp clicado".

**Limites conhecidos**
- Os números do prestador somam linhas da tabela `cliques`; o log de auditoria não entra.
- "Pessoas diferentes" é por navegador: quem limpa os cookies ou troca de aparelho conta como outra pessoa.
- O ranking do admin mostra só os 10 primeiros prestadores e as 20 maiores combinações de origem e campanha.

### Passo 4 — Decisão sobre os demais botões de WhatsApp (28/10/2026)

**Decisão (Célio):** não rastrear `ServicoCard` (meus serviços) nem `CardPrestador` (acompanhamento).

**Motivo:** diferente do `PerfilCTA` (perfil público, "Solicitar Orçamento" — um lead novo), esses dois botões aparecem depois que o cliente já aceitou o prestador e o serviço está em andamento ou concluído. São um telefone de contato sobre um serviço que já existe, não um pedido de orçamento novo. Contar os três juntos infla "pedidos de orçamento" com cliques que não são leads — e a tabela `cliques` não tem coluna para distinguir os dois casos, então misturar agora corrige errado depois (exigiria mudança de schema). Nenhum código foi alterado nesses dois componentes.

Se no futuro fizer sentido medir esse tipo de engajamento pós-contrato, deve ser uma métrica separada (ex: coluna `tipo` em `cliques`, ou tabela própria), nunca somada a "pedidos de orçamento".

### Passo 5 — Limpeza (28/10/2026)

**O que foi feito:** removido o prefixo `[v0] ` de todas as 12 ocorrências de `console.error` encontradas no código (`WizardCompleted.tsx`, `usePrestadores.ts`, `useAdminDashboard.ts`, `useAdminLogs.ts`, `useHabilidades.ts` ×2, `useAvaliacoesRecebidasCliente.ts`, `useAvaliacaoClienteDoProjeto.ts` ×2, `usePortfolioDashboard.ts`, `app/api/admin/prestadores/route.ts`, `denuncia.service.ts`). Só o texto do prefixo mudou — nenhuma lógica foi tocada.

**Não feito nesta sessão:** `smoke.mjs --writes` não rodou — o ambiente de trabalho não tem `node_modules` instalado nem acesso ao Supabase do PQF (mesma limitação já registrada nos passos 1–3). Rodar manualmente antes de abrir o PR para produção, ou validar no deploy de preview.

**Validado pelo Célio em produção (28/10/2026):** rodou `node scripts/smoke.mjs --writes` contra `https://procuroquemfaca.com.br`. 10 testes passaram; 1 "falhou" (`Cookie pqf_origem é gravado com utm na URL`) por um bug do próprio script, não da aplicação — o domínio raiz redireciona (307) para `www.procuroquemfaca.com.br` direto na Vercel, antes do `proxy.ts` rodar, e o teste usava `redirect: 'manual'`, então só via essa primeira resposta (sem Set-Cookie, porque o proxy.ts nem chega a ser chamado nela). Um visitante real sempre segue o redirect e cai em `www`, onde o cookie é gravado normalmente — confirmado com `curl.exe -i` mostrando o `307`/`Location` e `x-vercel-id` da Vercel, antes de qualquer código do Next.js. Corrigido o script (`scripts/smoke.mjs`): os 3 testes de cookie agora seguem manualmente até 5 saltos de redirect, acumulando os `Set-Cookie` de cada um, em vez de olhar só a primeira resposta. Testes de escrita (`--writes`) pulados porque a base não era localhost e `--confirmo-producao` não foi usado — nenhuma linha de teste foi gravada em `cliques`.

**Re-validado pelo Célio (28/10/2026) após a correção:** `node scripts/smoke.mjs --writes` contra produção — **11 passaram, 0 falharam, 1 pulado** (o de escrita, mesma razão de antes). Passos 2 e 3 ficam validados de ponta a ponta em produção.

### Passo 6 — Remover o INSERT público em `cliques` (28/10/2026)

**Confirmado antes de remover:** a única inserção em `cliques` no código é `inserirClique()` (`lib/services/cliques.service.ts`), chamada só pela rota `/api/prestadores/clique-whatsapp`, que usa `getAdminClient()` (service role — ignora RLS). Nenhum caminho do app depende da política pública; ela só era superfície de ataque (qualquer pessoa com a chave anon podia inserir cliques falsos direto pela API do Supabase, sem dedupe, sem filtro de robô, sem respeitar a amostra).

**O que foi feito:** migration `supabase/migrations/20261028220000_remove_insert_publico_cliques.sql` — `drop policy if exists "Qualquer um pode registrar um clique" on public.cliques`. Depois dela, com RLS ativo e sem política de INSERT, o Supabase nega por padrão qualquer inserção feita com a chave anon ou por usuário comum; a rota continua funcionando normalmente porque usa o cliente administrativo.

**Aplicado pelo Célio em produção (28/10/2026)** direto no SQL Editor do Supabase. A política pública de `INSERT` não existe mais em `cliques`.

### Passo 7 — Sair do modo amostra (28/10/2026)

**Decisão (Célio):** encerrar o teste por amostra e passar a contar cliques de todos os prestadores, não só dos 15 da tabela `rastreio_amostra`.

**O que foi feito:** ajuste de dados no banco (não é migration — mesmo comando já previsto no Passo 1):
```sql
update public.rastreio_config
set valor = 'todos', atualizado_em = now()
where chave = 'modo';
```

**Efeito imediato, sem deploy:** `deveRastrear()` (`lib/tracking/amostra.ts`) passa a devolver `true` para qualquer prestador. O card "Pedidos de orçamento pelo WhatsApp" no dashboard (`/dashboard`) mostra os números reais para todo mundo, em vez do aviso de contagem não ativa. Em `/admin/cliques`, o aviso fixo passa de "modo amostra com 15 prestadores" para "modo todos".

**Observação:** a tabela `rastreio_amostra` não precisa ser apagada — fica sem efeito enquanto `rastreio_config.valor = 'todos'`, e serve de histórico de quem foi testado primeiro.

### Passo 8 — Versionar o SQL que existia só no banco (28/10/2026)

**Decisão (Célio):** versionar primeiro o que está só em produção, com migrations idempotentes (em produção não alteram nada), e só depois mexer nas visitas. O índice duplicado sai em uma migration separada.

**Conferido no banco de produção** (consultas de leitura em 28/10):
- `perfis_admin`: `user_id` (uuid, chave primária, FK para `auth.users`), `email` (not null), `role` (padrão `editor`, só `owner`, `moderator` ou `editor`) e `created_at`. RLS ativo, com uma política: a pessoa lê a própria linha.
- `is_admin()`: função SQL `STABLE`, `SECURITY DEFINER`, com `search_path` vazio, que consulta `perfis_admin` pelo usuário logado.
- `visitas_perfil`: `id` (identity), `prestador_id` (not null), `criado_em` (not null, padrão `now()`), `origem` (até 60 caracteres), `campanha` (até 100) e `sessao_id` (até 64). RLS ativo. Políticas: admin lê tudo, prestador lê só as próprias e **qualquer pessoa insere** (ainda aberta; sai no passo 9).
- Chaves estrangeiras de `cliques`, `rastreio_amostra` e `visitas_perfil`: todas para `prestadores(id)` com `ON DELETE CASCADE`. Apagar um prestador apaga o histórico de cliques e visitas dele.
- Índices de `visitas_perfil`: `idx_visitas_perfil_prestador_data` (crescente) e `idx_visitas_prestador_data` (decrescente) eram redundantes entre si.
- Modo do rastreio: **`todos`** (desde o Passo 7; a seção do Passo 1 registra `amostra`, o valor de 25/10).

**O que foi feito:** duas migrations em `supabase/migrations`.
- `20261028230000_versiona_is_admin_e_visitas_perfil.sql`: cria o que falta de `perfis_admin`, `is_admin()` e `visitas_perfil`, as políticas, os dois índices que ficam, as FKs (só se `prestadores` existir e se a tabela ainda não tiver FK para ela) e garante a política de leitura do admin em `cliques`, que a migration de cliques pula em ambiente novo porque `is_admin()` ainda não existe.
- `20261028230100_remove_indice_duplicado_visitas_perfil.sql`: remove `idx_visitas_perfil_prestador_data`, mantendo o decrescente.

**Aplicadas pelo Célio no SQL Editor em 28/10.** Conferido depois: o índice duplicado sumiu, as políticas e FKs ficaram iguais e as 1.281 visitas continuam lá.

**Testes feitos antes** (Postgres 16 local, com `auth` e papéis do Supabase simulados): ambiente novo com `prestadores`, ambiente novo sem `prestadores` (as partes que dependem dela são puladas com um aviso), reexecução sem erro e sem mudar nada, estado parecido com produção (FK com outro nome não é duplicada e o índice redundante é removido) e `is_admin()` verdadeiro para quem está em `perfis_admin`.

**Limite conhecido:** `supabase/migrations/20260201183500_remote_schema.sql` tem 0 linhas. `prestadores`, `profiles` e o restante do schema não estão em nenhuma migration, então um ambiente novo ainda não sobe só com as migrations. A correção é rodar `supabase db pull` e commitar o resultado nesse arquivo (pendente).

**Observação:** `anon` e `authenticated` têm todos os privilégios de tabela em `perfis_admin` e `visitas_perfil`. O RLS cobre o acesso, mas vale endurecer depois.

### Passo 9 — Visitas gravadas pelo servidor (28/10/2026)

**Decisão (Célio):** as visitas seguem as mesmas regras dos cliques, e a política pública de `INSERT` em `visitas_perfil` só sai depois do deploy, para a gravação não parar no intervalo.

**Por que:** `registrarVisitaPerfil` inseria direto do navegador, só com `prestador_id`. Isso deixava qualquer pessoa com a chave pública inflar a contagem, contava robôs que executam JavaScript e a visita do próprio dono, e não gravava origem, campanha nem sessão (as 1.281 visitas atuais não têm `sessao_id`).

**O que mudou:**
- `app/api/prestadores/visita-perfil/route.ts` (novo): `POST` com as regras no servidor. Ignora robôs, ignora a visita do dono logado, conta no máximo 1 visita por sessão e prestador a cada 24h, respeita o modo do rastreio (`rastreioAtivoPara`) e grava origem e campanha (cookie `pqf_origem`, depois o referer, depois `direto`). Usa o mesmo cookie `pqf_sid` dos cliques, então visita e clique da mesma pessoa podem ser ligados no funil. Sempre responde ok quando ignora a visita.
- `lib/services/visitas.service.ts` (novo): consultas da rota (`buscarPrestadorParaVisita`, `jaContouVisitaRecente`, `inserirVisita`). Na tabela de visitas a data é `criado_em`, e não `created_at`.
- `lib/db/visitasPerfil.ts`: `registrarVisitaPerfil` passa a chamar a rota, com `keepalive`. O cookie de 24h por prestador só evita chamadas repetidas do mesmo navegador e é gravado quando o servidor responde ok. Pedidos simultâneos para o mesmo prestador são evitados. A leitura (`getVisitasDoMesAtual` e `getVisitasTotais`) não mudou. O hook `usePerfilPrestador` também não mudou.
- `scripts/smoke.mjs`: novos testes de visita (válida, repetida, robô e pedido inválido) e a opção `--modo todos|amostra`. O teste "fora da amostra" é pulado no modo `todos` (o padrão); antes ele falharia em produção, porque nesse modo todo prestador é contado. Os testes de escrita agora falam direto com o endereço final (`www`), porque o `fetch` do Node descarta o cookie ao seguir o redirect do domínio raiz (ver a observação de 29/10 abaixo).

**Efeitos a observar:**
- A visita do próprio dono do perfil deixa de contar (antes contava).
- As visitas novas passam a ter `origem`, `campanha` e `sessao_id`. As antigas continuam sem `sessao_id`.
- Quem já tem o cookie `pqf_visita_perfil_<id>` só volta a ser contado depois de 24h.
- A verificação do dedupe e a gravação não são atômicas, como nos cliques. Duas chamadas quase simultâneas da mesma sessão podem gravar duas linhas. Na prática o cliente evita isso, mas o servidor não garante.

**Verificação feita:** 64 testes passando (12 do lado do navegador, 18 da rota com o banco simulado e os 34 que já existiam). `eslint` sem erros nos arquivos novos e `tsc` sem erros novos (os 2 de `components/ads/AdCard.tsx` já existiam). Quebrar de propósito a regra do dono, a de 24h e a checagem de resposta ok no cliente faz o teste correspondente falhar.

**Não verificado:** `pnpm build`, a rota contra o banco real e a página no navegador.

**Como validar depois do deploy**
1. Rodar `node scripts/smoke.mjs --base https://procuroquemfaca.com.br --writes --confirmo-producao` e conferir que os testes de visita passam. Depois apagar os testes: `delete from public.visitas_perfil where campanha = 'teste';`
2. Abrir um perfil em guia anônima, atualizar 5 vezes e conferir que entrou 1 linha nova, com `origem` e `sessao_id` preenchidos:
   ```sql
   select id, prestador_id, origem, campanha, sessao_id, criado_em
   from public.visitas_perfil
   order by criado_em desc limit 5;
   ```
3. Abrir `?utm_source=meta&utm_campaign=teste` em outra guia anônima e conferir `origem = meta` e `campanha = teste`.
4. Logado como o dono do perfil, abrir o próprio perfil: não deve entrar linha nova.

**Situação (29/10): concluído em produção.** Deploy feito e `smoke.mjs --writes` passou (19 passaram, 0 falharam, 1 pulado). Conferência no navegador, confirmada no banco: cinco atualizações do mesmo perfil gravaram 1 linha (origem `direto`, `sessao_id` preenchido) e a visita com `?utm_source=meta&utm_campaign=teste-nav` gravou origem `meta` e campanha `teste-nav`, na mesma sessão da anterior (as janelas anônimas compartilham cookies). A migration `20261029230000_remove_insert_publico_visitas_perfil.sql` foi aplicada pelo Célio e as linhas de teste foram apagadas. Conferido no banco depois: `visitas_perfil` e `cliques` têm só as duas políticas de leitura (admin e prestador) e `cliques` não tem linhas de teste. A conferência do dono do perfil (item 4) não foi confirmada em produção; essa regra está coberta apenas pelos testes da rota. A `20261028230000` continua criando a política pública em ambiente novo, e a `20261029230000` a remove em seguida.

**Observação (29/10/2026) — primeira rodada de `--writes` em produção:** 14 testes passaram e 5 falharam.
- O teste "Repetir o clique na mesma sessão NÃO conta" falhou por um bug do script, não da aplicação. O domínio raiz redireciona (307) para `www` e o `fetch` do Node descarta o cabeçalho `Cookie` ao seguir um redirect para outro domínio, então a repetição chegou ao servidor sem o `pqf_sid` e foi contada como sessão nova. O banco confirma: as 4 linhas de teste em `cliques` (ids 64 a 67) vieram em pares com `sessao_id` diferentes, nunca repetido. Corrigido no `scripts/smoke.mjs` (`resolverBaseFinal`). Uma rodada intermediária ainda falhou porque a versão antiga do script estava em uso (as sessões continuavam diferentes no banco). Com a versão corrigida, a rodada de 29/10 passou: **19 passaram, 0 falharam, 1 pulado** (o teste "fora da amostra", pulado no modo `todos`).
- Os 4 testes de visita falharam com 404 porque a rota nova ainda não estava no ar. Eles devem passar depois do deploy.
- As rodadas deixaram linhas de teste em `cliques` e em `visitas_perfil` (`campanha = 'teste'`). Apagar com `delete from public.cliques where campanha = 'teste';` e `delete from public.visitas_perfil where campanha = 'teste';`.

### Passo 10 — Card de visitas no painel do prestador (30/10/2026)

**Objetivo (Fase 1 do planejamento):** mostrar ao prestador que o perfil dele está sendo visto. É o incentivo para ele usar a plataforma.

**Decisões (Célio):**
- Entram **todas** as visitas desde 27/08, inclusive as gravadas pelo navegador antes de 29/10. Essas incluem a visita do próprio dono e de robôs que executam JavaScript, então os números antigos podem estar levemente inflados. O card não traz nota sobre isso (decisão de 30/10).
- A variação em relação ao período anterior aparece **só quando é positiva**. A base para mostrar a negativa fica pronta: para ligar, troque `MOSTRAR_VARIACAO_NEGATIVA` para `true` em `lib/utils/variacaoVisitas.ts`. O cálculo, o tipo (`sentido: 'alta' | 'queda'`), o card e os testes já tratam a queda, que apareceria em cinza e não em vermelho.
- Perfil sem nenhuma visita mostra só uma mensagem curta de incentivo, sem lista do que falta no perfil.

**O que foi feito:**
- `supabase/migrations/20261030120000_funcao_resumo_visitas_prestador.sql`: função `public.resumo_visitas_prestador()`. É `SECURITY DEFINER`, `STABLE`, sem parâmetros e com `search_path` vazio. Descobre o prestador por `auth.uid()` e devolve uma linha com `visitas_7d`, `visitas_7d_anterior`, `visitas_30d`, `visitas_30d_anterior` e `visitas_total`, contadas no banco pelo índice `(prestador_id, criado_em desc)`. Quem não tem perfil de prestador recebe zero linhas. Só o papel `authenticated` executa (`revoke` de `public` e `anon`).
- `lib/db/resumoVisitas.ts`: chama a função e converte para camelCase.
- `hooks/useMinhasVisitas.ts`: estado de carregando, erro e dados, no mesmo formato de `useMeusCliques`.
- `lib/utils/variacaoVisitas.ts`: cálculo e regra de exibição da variação (sem base ou 0% não mostra nada).
- `components/dashboard/VisitasPerfilCard.tsx`: o card. Esqueleto com a altura reservada, estado vazio, erro, três quadros (7 dias, 30 dias e total). Entra no `dashboard/page.tsx` acima do card de cliques, com as mesmas condições (cadastro completo e conta não bloqueada).
- `getVisitasDoMesAtual` e `getVisitasTotais`, em `lib/db/visitasPerfil.ts`, seguem sem uso. O card não depende delas.

**Verificação feita:**
- Postgres 16 local, com `auth` e os papéis do Supabase simulados. As janelas de 7 e 30 dias e as anteriores bateram com o esperado, com visitas a 1 hora, 6 dias e 23 horas, 7 dias e 1 hora, 13, 20, 31, 59 e 61 dias.
- Isolamento: um prestador não enxerga as visitas de outro; usuário sem perfil de prestador e usuário logado sem identificação recebem zero linhas; prestador sem visitas recebe uma linha de zeros; `anon` recebe `permission denied`.
- Volume: 1,5 milhão de visitas, 5 mil prestadores e um prestador com 200 mil visitas. Prestador típico (cerca de 230 visitas): 1,3 a 1,9 ms. Prestador com 200 mil visitas: 80 a 100 ms, com varredura apenas pelo índice (`Heap Fetches: 0`). Executar o mesmo cálculo sob RLS, com a função `INVOKER`, custaria mais (cerca de 136 ms no mesmo caso) porque as políticas de `visitas_perfil` são avaliadas linha a linha; por isso a função é `DEFINER`.
- 95 testes passando (70 anteriores e 25 novos: variação, serviço, hook e card). `eslint` limpo e `tsc` sem erros novos. Quebrar de propósito a regra de exibição e o estado vazio faz os testes falharem.

**Correção em migration já aplicada:** o bloco de FKs da `20261028230000_versiona_is_admin_e_visitas_perfil.sql` usava `to_regclass(...) is not null and not exists (... ::regclass ...)`, e o Postgres não garante o curto-circuito do `AND`; rodada isolada, sem `cliques`, a migration dava erro. Agora são dois `IF`. Em produção e na cadeia normal de migrations não muda nada.

**Não verificado:** o card em navegador (altura sem pulo em Fast 3G, leitura no celular) e a função no banco de produção.

**Como validar depois de aplicar a migration e do deploy:**
1. Conferir os privilégios: `select has_function_privilege('anon', 'public.resumo_visitas_prestador()', 'execute'), has_function_privilege('authenticated', 'public.resumo_visitas_prestador()', 'execute');` deve dar `false` e `true`.
2. Logar como um prestador com visitas (9 contas tiveram visita nos últimos 30 dias): o card mostra os três números, e a variação só se for positiva.
3. Logar como um prestador sem visitas: aparece a mensagem curta de incentivo.
4. No celular, com a rede lenta (Fast 3G): os três quadros têm a mesma altura e o card não pula quando os números chegam.

**Migrations para commitar** (as três primeiras já foram aplicadas pelo console e a quarta ainda será; até 30/10 nenhuma das quatro estava no repositório): `20261028230000` (versão corrigida), `20261028230100`, `20261029230000` e `20261030120000`.

### Passo 11 — Verificação automática no GitHub (30/10/2026)

**Decisão (Célio):** rodar testes, lint e tipos a cada push. Antes, nada disso rodava sozinho: a pasta `.husky` não tem hook de commit ou push, e o único workflow existente é o do Playwright (e2e).

**O que foi feito:**
- `.github/workflows/ci.yml` (novo): dispara em todo `push` e também manualmente. Um push novo na mesma branch cancela a verificação anterior. Usa Node 22 e pnpm 12, com cache, e instala com `pnpm install --frozen-lockfile`. Os passos são `pnpm test:run`, `pnpm lint` e `pnpm exec tsc --noEmit`; lint e tipos rodam mesmo que o teste falhe, para o resultado mostrar tudo que está quebrado de uma vez. Não roda `pnpm build`, que precisa das chaves do Supabase; o build é validado pelo deploy da Vercel. O workflow do Playwright não foi alterado.
- `pnpm-workspace.yaml`: `core-js` e `unrs-resolver` em `allowBuilds` passam de "set this to true or false" para `false`. Com o texto no lugar do valor, `pnpm install --frozen-lockfile` falha com `ERR_PNPM_IGNORED_BUILDS`, e o CI quebraria já na instalação. Os dois scripts de instalação não são necessários: testes, lint e tipos funcionam sem eles.
- `types/adsbygoogle.d.ts` (novo): declara `window.adsbygoogle`. Sem isso o `tsc` falhava em `components/ads/AdCard.tsx` (2 erros que já existiam), e o CI nasceria vermelho.

**Verificação feita** (checkout limpo do commit `742b232`, simulando o CI):
- A instalação congelada passa com pnpm 10.34.9, 11.28.9 e 12.16.1, e falha com o `pnpm-workspace.yaml` como estava.
- Antes das correções: 70 testes passando, lint sem erros e 2 erros de `tsc` (os do `AdCard`). Depois: `tsc` com 0 erros.
- Cada verificação falha quando algo está quebrado: um teste alterado, uma regra de lint violada e um tipo errado derrubam a execução (códigos de saída diferentes de 0).
- `actionlint` não apontou problemas no workflow.

**Não verificado:** a primeira execução no GitHub, em um runner de verdade.

**Para o CI bloquear merge:** o workflow só avisa. Para impedir o merge com o CI vermelho, é preciso ativar uma regra de proteção na branch principal exigindo o check "Testes, lint e tipos" (Settings, Branches). Isso é configuração do GitHub, fora do código.
