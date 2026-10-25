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

- [~] 1. Conferir modo e criar migration — migration escrita, falta confirmar o modo (ver seção 5)
- [ ] 2. `keepalive` e log unificado
- [ ] 3. Exibir cliques nos painéis
- [ ] 4. Decidir rastreio dos demais botões
- [ ] 5. Limpeza e smoke test
- [ ] 6. Remover a política pública de `INSERT` em `cliques`

## 5. Registro por passo

### Passo 1 — Conferir o banco e versionar as tabelas (25/10/2026)

**O que foi conferido no banco de produção** (consultas executadas pelo Célio no SQL Editor; a sessão do Claude não tem acesso ao projeto do PQF, que fica em outra conta do Supabase):

- `rastreio_amostra` tem **15 prestadores**.
- `cliques`: `id` (bigint, sem default visível, provavelmente identity), `prestador_id` (bigint), `created_at` (timestamptz, default `now()`), `origem`, `campanha` e `sessao_id` (text). Só `id` é `NOT NULL`.
- `rastreio_amostra`: `prestador_id` (bigint, `NOT NULL`), `observacao` (text), `criado_em` (timestamptz, default `now()`).
- `rastreio_config`: `chave` e `valor` (text, `NOT NULL`), `atualizado_em` (timestamptz, default `now()`).
- Políticas de `cliques`: admin lê tudo (`is_admin()`); prestador lê só os próprios; **qualquer pessoa pode inserir** (pendência 10). Não há políticas em `rastreio_config` nem em `rastreio_amostra`. O RLS está **ativo nas três tabelas** (confirmado), então só a chave administrativa acessa `rastreio_*`.
- Conteúdo de `cliques`: **19 linhas com origem e campanha nulas** (da versão antiga da rota, anteriores à Tarefa 3, de 22/10) e **8 linhas `meta` / `teste`** (do `smoke.mjs --writes`). Nenhuma linha `direto` nem de campanha real foi gravada pela rota nova.
- Os 8 registros de teste deviam ser apagados com `delete from public.cliques where campanha = 'teste';`. A contagem prévia deu 8; **não foi confirmado se o `delete` foi executado**.

**O que foi feito:** a migration `supabase/migrations/20261025114000_rastreio_cliques_whatsapp.sql` (branch `fix/passo1-migration-rastreio`) versiona as três tabelas, ativa o RLS e recria as três políticas existentes. É idempotente: em produção não muda nada. Para a primeira política, depende de `is_admin()`, que também não está versionada. O valor inicial de `modo` é `amostra`, só quando a chave não existe.

**Ainda pendente neste passo:**
- Valor atual de `rastreio_config` (chave `modo`): `amostra` ou `todos`. É ele que explica por que nenhum clique real aparece desde 22/10. Só 15 prestadores estão na amostra; se o modo for `amostra`, o resto não é contado.
- Índices, chaves primárias e estrangeiras de `cliques` (resultado da consulta não coletado).
- Versionar `is_admin()`, que não está em nenhuma migration do repositório.
- Aplicar a migration em um ambiente novo ou de homologação para validar.
