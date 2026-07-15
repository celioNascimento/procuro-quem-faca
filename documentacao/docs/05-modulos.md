# Módulos — PQF

Este documento cobre os módulos de produto em detalhe, complementando a visão de arquitetura em [`02-arquitetura.md`](./02-arquitetura.md).

---

## Cadastro de Prestador

**Rota:** `app/cadastro/page.tsx`
**Componente:** `CadastroPage` → `FormularioCadastro` (envolvido em `Suspense` por usar `useSearchParams`)

### O que essa tela faz

Um único formulário multiuso que cobre **três cenários diferentes**, decididos em tempo de execução:

1. **Cadastro novo** — usuário sem sessão e sem registro em `prestadores`
2. **Edição de perfil existente** (`modoEdicao`) — usuário já logado com um registro próprio em `prestadores`
3. **Reivindicação de perfil** (`?reivindicar=<id>`) — usuário assume um perfil criado por curadoria pública (`origem_tipo: 'curadoria_publica'`) que ainda não tem `user_id`

### Hooks orquestrados

| Hook | Responsabilidade |
|---|---|
| `usePrestadorForm` | Estado do formulário (`formData`), handlers de campo (`handleNomeChange`, `handleWhatsappChange`, etc.), `toggleItem` para arrays (habilidades, cidades atendidas) |
| `useCategorias` | Carrega grupos, categorias e habilidades disponíveis |
| `useLocalizacao` | Carrega estados, regiões e cidades em cascata |
| `useSlugCheck` | Verifica disponibilidade do slug em tempo real conforme o usuário digita |

### Subcomponentes de seção (`components/perfil/`)

Reaproveitados tanto no Cadastro quanto na Edição de Perfil (dashboard) — inputs controlados simples, sem lógica própria de negócio, recebendo estado e callbacks via props:

| Componente | Campos |
|---|---|
| `FotoUpload` | Upload de foto de perfil, preview, dois variantes visuais (`cadastro` mais espaçoso, `dashboard` mais compacto) |
| `SecaoDadosPessoais` | Nome, slug (com indicador de disponibilidade em tempo real), WhatsApp, bio |
| `SecaoOQueVoceFaz` | Grupo de atuação, categoria/profissão principal, habilidades extras (chips togglable) |
| `SecaoLocalizacao` | Estado, região, cidade sede, bairro, cidades vizinhas atendidas (chips) |
| `SecaoTermos` | Checkboxes de aceite de termos e política de privacidade |

### Fluxo de inicialização (`useEffect` com `inicializadoRef` para rodar uma única vez)

```
Verifica sessão atual
      ↓
Tem user + já tem prestador ativo (não pendente, não curadoria)?
      → Sim: redireciona para /dashboard (bloqueia cadastro duplicado)
      ↓ Não
Carrega listas base (grupos, habilidades, estados) em paralelo
      ↓
Tem ?reivindicar=<id>?
      ├─ Sim → busca esse prestador específico
      │         ├─ já tem user_id igual ao logado? → vai pra /dashboard
      │         ├─ já tem user_id de outra pessoa? → modal "Perfil Indisponível"
      │         └─ sem user_id → carrega dados no form, pré-aceita termos, modoEdicao=false
      ↓ Não
Tem prestador próprio (perfilExistente)?
      → Sim: carrega no form, modoEdicao=true
      → Não: pré-preenche nome com dado do Google (user_metadata.full_name), região padrão PR
```

### Autenticação embutida no formulário

Diferente da tela `/login`, aqui o cadastro de conta **acontece dentro do mesmo formulário** de dados profissionais — não há redirecionamento para outra tela:

- Usuário não logado → campos de email/senha aparecem inline (`SecaoAcessoCadastro`)
- Usuário já logado → mostra dados da sessão + opção de trocar senha (`SecaoAcessoLogado`)

No submit, se não há sessão:
```typescript
supabase.auth.signUp({ email, password: senha, ... })
```
Se o email já existe (`already registered`), tenta login automático com a senha informada em vez de mostrar erro — só falha de verdade se a senha estiver incorreta, caso em que mostra modal orientando ir para `/login`.

> 💡 **Isso é um segundo ponto de criação de conta**, além da tela `/login` documentada em [`04-autenticacao.md`](./04-autenticacao.md).

### Validação e progresso

`calcularProgresso()` roda a cada render, verificando 9 condições (nome, whatsapp, categoria, cidade, foto, termos, privacidade, slug disponível, senha válida se aplicável) e retorna uma porcentagem — usada tanto na barra de progresso do header quanto para habilitar/desabilitar o botão de submit (exige 100%).

### Upload de foto

`fazerUploadFoto(file, userId, fotoAntigaUrl?)` — função em `lib/uploadFoto.ts`. Trata erro de arquivo grande (`TOO_LARGE`) com modal específico mostrando o tamanho real do arquivo.

### Submit — o que acontece na ordem

```
1. Validações finais (foto obrigatória, slug disponível, senhas conferem)
2. Se sem sessão → signUp (ou signIn se já existir o email)
3. Se logado e trocando senha → updateUser({ password })
4. Limpa nome de cidades_atendidas duplicando a cidade-sede
5. Se reivindicando → deleta qualquer outro registro de prestador do mesmo user_id
6. upsert em `prestadores` com status: 'ativo', origem_tipo calculado
7. Se não estava logado → signInWithPassword (garante sessão ativa)
8. Redireciona para /dashboard (hard redirect via window.location.href, não router.push)
```

**Nota técnica:** o uso de `window.location.href` força reload completo, garantindo que o `useAuth` reprocesse a sessão do zero.

### Exclusão de perfil

Botão de excluir (dentro de `CadastroCard`) abre `ModalConfirmacao` → `handleExcluirPerfil` deleta o registro de `prestadores` diretamente (cascata via FK cuida de fotos/projetos/avaliações vinculados).

### Pontos de atenção

- **Regra de bloqueio de recadastro** (`perfilExistente.status !== 'pendente'`) depende de `status`, o mesmo campo usado pelo `useAuth`/`HeaderBotoes`.

---

## Dashboard do Prestador

**Route group:** `app/(dashboard)/dashboard/`

```
app/(dashboard)/dashboard/
├── layout.tsx          # DashboardLayout — header com botão voltar dinâmico
├── page.tsx             # Dashboard raiz (conteúdo não detalhado ainda)
└── perfil/
    └── page.tsx          # PerfilPage — abas "Meus Projetos" / "Dados Profissionais"
```

### `layout.tsx` — `DashboardLayout`

O `Header` recebe `href` dinâmico via `?origem=` na query string — permite que "voltar" no dashboard leve o prestador de volta à página exata de onde ele veio.

### `usePerfilStatus` — gatekeeper do dashboard

```typescript
cadastroCompleto = !!(prestador?.nome?.trim() && prestador?.whatsapp && prestador?.categoria_id)
```

Três campos mínimos — mais permissivo que a validação de 100% do cadastro original.

### `perfil/page.tsx` — `PerfilPage`

| Aba | Componente | Condição de bloqueio |
|---|---|---|
| **Meus Projetos** (padrão) | `PortfolioDashboardTab` | Bloqueada se `!cadastroCompleto` |
| **Dados Profissionais** | `EditarPerfilTab` | Nunca bloqueada |

Se `!validando && !cadastroCompleto`, força a aba para `perfil`. Terceiro item "Ver meu perfil" (link externo, `/${slug}`) só aparece quando `slug` existe.

### Aba "Dados Profissionais" — `EditarPerfilTab.tsx`

Reaproveita os mesmos hooks e subcomponentes de seção do `FormularioCadastro`.

**Promoção automática do funil de ativação:**
```typescript
const novoAtivacaoStatus =
  camposObrigatoriosOk && (statusAtual === 'nao_enviado' || !statusAtual)
    ? 'perfil_completo'
    : statusAtual
```
Não sobrescreve estados que vieram de outro fluxo (`respondeu_positivo`, `sem_whatsapp`).

**✅ Exclusão de conta corrigida (simétrica com o cliente):** `handleExcluirContaTotal` remove a foto do Storage, deleta a linha em `prestadores`, **e agora também chama `/api/delete-account`** (remoção real do usuário em `auth.users` via service role) + `signOut()`. Antes dessa correção, o prestador ficava órfão em `auth.users` mesmo após "excluir a conta" — lacuna de LGPD real, já corrigida. Ver também Painel do Cliente, que já fazia essa chamada corretamente.

### Aba "Meus Projetos" — `PortfolioDashboardTab.tsx`

Orquestra `usePortfolioDashboard`, alterna entre visão lista (`PrestadorSideCard` + `DashboardHeader` + grid de `ProjetoCard`/`EstadoVazio`) e visão wizard (`PrestadorSideCard` + `UploadWizardContainer`, com `key` por projeto para reset de estado).

**`getStatusConfig` (`ProjetoCard`)** — mapeia `status` + presença de avaliação em 5 rótulos: Rascunho (`em_registro`), Aguard. cliente (`pendente`), Em progresso (`em_execucao`), Concluído (`finalizado` + avaliado), Aguard. avaliação (`finalizado` sem avaliação). Derivação de UI, não existe status de banco "aguardando avaliação".

### ✅ Confirmado: `UploadWizard.tsx` é seguro para deletar

`PortfolioDashboardTab.tsx` já usa `UploadWizardContainer` (via `key={projetoParaEdicao?.id || 'novo'}`), não o `UploadWizard.tsx` antigo — o bug de loop que motivou a reescrita foi corrigido de ponta a ponta.

### Refatoração do wizard em subcomponentes

`PrestadorCardHorizontal.tsx` documenta no próprio código a intenção: substituir o hero azul inline do `UploadWizardContainer.tsx` por `<PrestadorCardHorizontal />` + `<WizardForm hookData={hookData} />`. `TimelineVertical` (`components/shared/`) já está em uso ativo do lado do cliente (`LinhaDeTempo`) — não é código órfão, só falta a integração do lado do prestador (`WizardTimeline.tsx`).

**Resumo do estado real:**
- `UploadWizard.tsx` → deletar (legado, confirmado não usado)
- `UploadWizardContainer.tsx` → ativo, funcional, hero/form/timeline ainda inline
- `PrestadorCardHorizontal.tsx` + `WizardForm.tsx` + `WizardTimeline.tsx` → peças prontas de refatoração não finalizada

### ⚠️ `PortfolioTab.js` é mock — não confundir com `PortfolioDashboardTab.tsx`

Usa imagens aleatórias do Picsum, não conectado a dados reais. Candidato a remoção.

---

## Painel do Cliente

**Rota:** `app/painel/perfil/page.tsx` (edição de dados) e `app/meus-servicos/page.tsx` (lista de serviços)

Dois módulos distintos do lado do cliente, com propósitos diferentes:

### `PerfilDoCliente` (`app/painel/perfil/page.tsx`) — dados + lista simplificada

**Hook:** `usePerfilCliente`, que compõe três hooks menores:
- `usePerfilDados` — dados pessoais (nome, whatsapp, endereço), upload de avatar, exclusão de conta
- `useServicosCliente` — busca serviços pelo WhatsApp do cliente, com filtros e navegação contextual
- `usePerfilUI` — estado de aba ativa, modal de confirmação de saída com alterações não salvas (`beforeunload`)

**`CardPerfilCliente`** — card de identidade com avatar clicável (upload direto), nome, email, localização, contadores de projetos ativos/totais.

**Duas abas:** "Meus Projetos" (lista filtrada por status) e "Minha Conta" (edição de dados + endereço completo + zona de perigo/exclusão).

**Roteamento contextual por serviço** (`getRotaDestino` em `useServicosCliente`):
```
status='pendente' → /meus-servicos?token=...  (aceitar)
status='em_execucao' sem foto 3 → /acompanhamento/[token]
status='em_execucao' com foto 3 → /avaliar/[token]
default → /avaliar/[token]
```

### `PainelDoCliente` (`app/meus-servicos/page.tsx`) — foco em aceitar/gerenciar múltiplos projetos

**Hook:** `usePainelCliente` + **`lib/services/painelCliente.service.ts`** (service dedicado, distinto de `cliente.service.ts`).

Acesso via `?token=` na URL (link enviado pelo prestador) **ou** fallback por WhatsApp salvo no perfil/localStorage. Tela de gate (`LoginGate`) se não houver sessão.

Filtros: Todos / Pendentes / Em andamento / Concluídos, com contadores. Ação principal: `handleAceitar` (atualiza `status: 'em_execucao'`, `aceito_at`, `cliente_nome`) — atualiza estado local antes de navegar (feedback otimista) e usa `router.push` (não hard reload).

### 🐛 Bug corrigido: `'concluido'` não existe no banco, mas era comparado em 3+ lugares

O valor real gravado em `portfolio_projetos.status` é **`'finalizado'`** (confirmado por dado real do banco). `'concluido'` nunca foi um valor válido. Isso causava:

1. **Na query** (`painelCliente.service.ts`): `.in('status', [..., 'concluido'])` — projetos finalizados **nem eram buscados do banco**, sumindo completamente de `/meus-servicos`. Corrigido para `'finalizado'`.
2. **Em `PainelDoCliente.tsx`**: três comparações (`concluidos = servicos.filter(s => s.status === 'concluido')`, `getModo`, `getOnAceitar`) tratavam `'finalizado'` como cai no fallback — projeto concluído aparecia com UI de "pendente" e, ao clicar, era roteado para o fluxo de **aceitar serviço** em vez de acompanhamento. Todas as 3 comparações corrigidas para `'finalizado'`.
3. **Em `cliente.service.ts`** (`fetchClienteServicos`), a query já incluía tanto `'finalizado'` quanto `'concluido'` na lista — mais seguro, mas ainda carregava um valor que nunca ocorre; limpo para manter só os 3 valores reais (`pendente`, `em_execucao`, `finalizado`).

O identificador de filtro de UI em `PainelDoCliente.tsx` (`Filtro = 'concluido'`) continua se chamando assim internamente — é só um nome de estado de UI, não compara diretamente com `servico.status` (a comparação real usa os arrays já corrigidos).

### ✅ Exclusão de conta do cliente — arquitetura de responsabilidade única

`ClienteService.deleteClienteAccount` (service) agora só limpa **dados de domínio**: deleta `profiles`, anonimiza `cliente_nome`/`cliente_whatsapp` em `portfolio_projetos`. A chamada real a `/api/delete-account` (remoção em `auth.users` via service role) e o `signOut()` foram movidos para `usePerfilDados.handleDeleteAccount` (hook orquestrador) — mesma responsabilidade que antes, reorganizada para "uma função, um trabalho": o service cuida de dados, o hook decide quando invalidar sessão/conta.

**`app/api/delete-account/route.js`** — Route Handler que usa um client Supabase normal para identificar o usuário logado, e um client **admin** (service role, nunca exposto ao browser) só para `supabaseAdmin.auth.admin.deleteUser(user.id)`. Compartilhado entre os fluxos de exclusão de cliente e prestador.

### 🐛 Bug de build corrigido: `logoutCliente` não existia

`hooks/useHeaderCliente.ts` importava `logoutCliente` de `@/lib/services/auth.service`, mas essa função nunca tinha sido criada lá. Adicionada como wrapper simples de `supabase.auth.signOut()` — nome mantido (embora genérico, não específico de cliente) por compatibilidade com o import já existente, usado tanto na área do cliente quanto em telas de acompanhamento/avaliação.

> ⚠️ **Duplicação não resolvida, mantida por segurança:** `painelCliente.service.ts` também tem uma função `logout()` fazendo a mesma coisa. Não foi removida porque não foi confirmado se `LoginGate.tsx` (não revisado) depende dela — candidata a consolidação numa próxima rodada, após confirmação.

### `ensureGoogleAvatarProfile` — código morto removido

Existia em `cliente.service.ts` mas nunca era chamada — `usePerfilDados` já fazia a mesma lógica inline (salvar avatar do Google se ainda não houver um próprio). Removida.

---

## Portfólio Público (perfil `[slug]`)

**Rota:** `app/[slug]/page.tsx`
**Componente:** `PerfilPublico` → `PerfilCarregado`

Estrutura em duas colunas: `PerfilHero` + ações na esquerda; `PerfilSobre`, `PerfilCTA`, `PortfolioGrid`, `PerfilAvaliacoes` na direita.

### `usePerfilPrestador` — hook de carregamento

Duas queries: `prestadores` com joins (`cidades`, `categorias`, `portfolio_projetos` + `portfolio_fotos` + `avaliacoes.indica`), filtrado por `slug` ou `id` (UUID); e `avaliacoes` separada, `visivel = true`, limite 10.

**Filtro de projetos:** só `em_execucao` e `finalizado` aparecem publicamente. **Ordenação:** finalizados primeiro, depois por data.

**Captura e limpeza do `?from=`:** usado como `urlRetorno` + log `VISITA_PERFIL_VIA_BUSCA`, removido da URL visível via `history.replaceState` sem novo fetch. Sem `?from=`, monta `urlRetorno` como `/prestadores?q=<categoria>`.

> Nome do parâmetro (`?from=`) diverge do `?origem=` usado no dashboard — mesma ideia, nomes diferentes. Ver roadmap.

### `PerfilHero.tsx`, `PerfilSobre.tsx`, `PerfilCTA.tsx`, `PortfolioGrid.tsx`, `PerfilAvaliacoes.tsx`

Já documentados em detalhe nas rodadas anteriores — hero com chips condicionais e ações (denunciar/compartilhar); bio com fallback textual motivando reivindicação; CTA de WhatsApp com botão flutuante persistente via `IntersectionObserver`; grid de projetos com badge "Indico"; lista simples de até 10 avaliações (retorna `null` se vazia — não mostra "nenhuma avaliação").

### `ProjetoModal.tsx` (abre a partir do `PortfolioGrid`)

Modal de detalhe de um projeto do portfólio público — usa `ModalFotoBase` (mesmo componente compartilhado do wizard do prestador) com navegação entre fotos via `useSlides`, comentários por foto via `useComentariosFoto`, botão de compartilhar (`navigator.share` com fallback de clipboard). Trata caso sem fotos com modal simplificado próprio.

### `useCompartilharPerfil` — hook completo, com service dedicado

`lib/services/compartilharPerfil.service.ts`: funções puras (`buildUrlPerfil`, `buildTextoPadrao`, `buildTextoWhatsApp`) + efeitos (`compartilharViaNative`, `compartilharViaWhatsApp`, `registrarCompartilhamento`). Dois modos expostos: `compartilhar()` (nativo/clipboard) e `compartilharWhatsApp(numero?)`. Todo compartilhamento é logado com canal + origem.

### `RastreamentoAtivacaoProvider`

Wrapper `Suspense` que só invoca `useRastreamentoAtivacao(prestador, srcParam)` a partir do `?src=` — não renderiza nada.

### ✅ Corrigido: `AdCard` no perfil usava valor inválido de `AdPage`

`page={"perfil" as AdPage}` → `page="perfil_prestador"`. O cast mascarava um valor que não existe no tipo `AdPage`. Import de `AdPage` removido do arquivo por não ser mais necessário.

---

## Avaliação

**Rota:** `app/avaliar/[token]/page.tsx`
**Hook:** `useAvaliar` (arquivo `hooks/useAvaliacao.ts` — nota: nome do arquivo no singular, export com nome diferente)

Reaproveita `CardPrestador` e `RodapeSeguranca` do módulo de Acompanhamento. `CarrosselFinalizacao` mostra as 3 fotos finais; `BlocoAvaliacao` captura nota/comentário/indica.

**Fluxo de submit (`handleFinalizarAvaliacao`):** `inserirAvaliacao` (grava `nota`, `comentario`, `indica`, `visivel: true`, `status: 'finalizado'`) → `finalizarProjeto` (marca o projeto como `finalizado`) → atualiza estado local → `router.push('/sucesso')`.

Se `avaliacaoExistente?.status === 'finalizado'`, oculta `BlocoAvaliacao` — impede reavaliação.

### `FormularioAvaliacao` — sistema de contestação/garantia descoberto

Existem **duas versões** deste componente em `components/profile/`:

- **`FormularioAvaliacao.tsx`** (ativo) — delega toda a lógica a `useSubmitAvaliacao` (estados `uploading`/`saving`), integra upload real de fotos de evidência via `FotosEvidenciaPicker`
- **`FormularioAvaliacao.js`** (legado) — grava direto no Supabase inline, com `alert()` como feedback, e tem o state `fotosEvidencia` declarado mas **nunca conectado a nenhum input real** — protótipo anterior, não funcional de fato. Candidato a remoção.

**Fluxo de contestação** (só na versão `.tsx` ativa): checkbox "Reportar problema / Solicitar Garantia" troca o formulário para modo contestação — oculta seleção de estrelas, muda placeholder do textarea, ativa `FotosEvidenciaPicker` (upload múltiplo, limite `MAX_ARQUIVOS`, preview com tamanho do arquivo, remoção individual). No submit, grava `avaliacoes` com `nota: 1`, `em_disputa: true`, `visivel: false`, e cria linha correspondente em `contestacoes` com descrição + URLs das fotos.

> Este fluxo de contestação é **diferente do fluxo de avaliação normal** (`useAvaliar`/`app/avaliar/[token]`) — `FormularioAvaliacao` parece ser usado em outro contexto ainda não mapeado (talvez uma ação disponível a qualquer momento no perfil, não só no fluxo linear pós-serviço). Vale confirmar onde esse componente é efetivamente renderizado.

### `AvaliacoesTab` / `AvaliacaoCard` / `AvaliacoesResumo` — pausados intencionalmente

Conjunto mais rico de exibição de avaliações (distribuição por nota em barras, % de indicação, resposta do prestador) que **não está conectado a nenhuma tela hoje** — só se referenciam entre si.

**Decisão registrada:** não plugar nem remover por ora. `PerfilAvaliacoes` (em produção) esconde a seção inteira quando não há avaliações (`return null`); `AvaliacoesTab` tem um estado vazio que **mostra ativamente** "Nenhuma avaliação ainda" — com o volume de tráfego/avaliações atual do produto, isso reforçaria a sensação de plataforma vazia, o oposto do que se quer no estágio atual. Revisitar quando houver volume suficiente de avaliações para a distribuição por nota fazer sentido visualmente.

🐛 **Bug corrigido:** `AvaliacoesResumo.tsx` importava `AvaliacoesStats` de `@/hooks/useAvaliacoes` (que só *usa*, não declara, esse tipo) em vez de `@/types/avaliacao` (declaração real). Import corrigido.

---

## Acompanhamento do Cliente

**Rota:** `app/acompanhamento/[token]/page.tsx`
**Hook:** `useAcompanhamento(token)` — acesso via `avaliacao_token`, sem exigir login.

Layout de duas colunas: `CardPrestador` + `StatusMini` + `RodapeSeguranca` (esquerda) e `LinhaDeTempo` (direita).

`LinhaDeTempo.tsx` usa `TimelineVertical` (componente compartilhado, confirmado em uso real — ver Dashboard do Prestador). Diferença chave em relação à timeline do prestador: cada nó é clicável e abre `ModalDiscussao`, com contador de comentários inline por foto.

---

## Reivindicação de Perfil

**Rota:** `app/reivindicar/page.tsx`

Tela intermediária, puramente informativa/motivacional. Só redireciona para `/cadastro?reivindicar=<id>` — toda lógica real vive no `FormularioCadastro`.

## Página de Sucesso

**Rota:** `app/sucesso/page.tsx`

Puramente estática, sem hooks de dados nem props. Botão "Compartilhar Resultado" sem `onClick` implementado. Não personaliza com dados do projeto/prestador avaliado.

## Denúncia

**Rota:** `app/denunciar/[id]/page.tsx`
**Service:** `criarDenuncia(prestadorId, motivo)` em `lib/services/denuncia.service.ts`

Formulário simples → tabela `denuncias` (`status: 'aberta'` por padrão). Aviso de "banimento por denúncia falsa" é só texto informativo, sem enforcement técnico visível nesta tela.

## ⚠️ Chat em tempo real — decisão: não será implementado (confirmado limpo)

Foram encontradas **três versões diferentes** de um componente `ProjetoTimeline` implementando chat em tempo real via tabela `projeto_mensagens` + Supabase Realtime, em pontos distintos do código (incluindo uma versão em `components/profile/` com confirmação de leitura estilo WhatsApp).

**Decisão registrada:** não será implementado — o WhatsApp já cumpre esse papel; replicar duplicaria esforço (Realtime, moderação, notificações) sem necessidade real.

**Status da limpeza:** uma busca (`grep`/`Select-String`) por `projeto_mensagens` em todo o código-fonte atual **não retornou nenhuma ocorrência** — os componentes `ProjetoTimeline` já não fazem parte do projeto ativo (ou foram removidos em alguma limpeza anterior, ou existiam apenas em versões/branches não mescladas). Nada a apagar. Se a tabela `projeto_mensagens` existir no banco, está órfã e pode ser removida do schema sem risco.

---

## Busca e Listagem de Prestadores

Módulo com dois pontos de entrada: a **home** (busca inicial) e **`/prestadores`** (resultados/listagem).

### Home — `app/page.tsx`

`Home` → `HeroSection` (dynamic import, `ssr: false`, só envolve `HeaderBotoes`) + `SearchForm`.

**`SearchForm.tsx`:** input controlado + botão, estado de erro visual. Usa `useRef` para ler valor do input diretamente no submit.

**Fluxo de submit:** sem termo → erro 3s; com termo → `insertLog('BUSCA_REALIZADA')` (fire-and-forget) → `router.push('/prestadores?q=<termo>')`.

**Sugestões (`useSugestoes`):** sem debounce no carregamento inicial, 300ms conforme digita. Fallback em duas camadas (banco vazio ou erro) para `SUGESTOES_FALLBACK`. Clicar dispara busca direto.

### `/prestadores` — Listagem

**Parâmetros de URL:** `q` (busca livre), `habilidade`, `cidade` (chip).

**Chips de cidade:** contagem por cidade calculada comparando `cidade_nome` e presença em `cidades_atendidas` — um prestador pode contar em mais de um chip.

**Injeção de anúncios:** `AdCard` no topo (`lista_topo`) e a cada 5 prestadores (`prestadores`), com `categoria={queryBusca || filtroHab}`.

### `usePrestadores` — lógica completa

**Carregamento:** `prestadores` ativos + médias de avaliação em paralelo, com `AbortSignal`. **Cálculo de média local** em JS (`calcularMedias`) — não usa a view `prestadores_ranqueados` que já faz isso no banco.

**Parsing de busca com cidade embutida:** `"pedreiro em Londrina"` → `{ termo: "pedreiro", cidadeExtraida: "Londrina" }` via regex, sincroniza `?cidade=` na URL via `router.replace` silencioso.

**Origem `'vitrine'` tem prioridade absoluta:** prestadores com esse `origem_tipo` aparecem sempre no topo, sem passar pelo filtro de busca. Valor não documentado formalmente em `03-banco-de-dados.md` até esta rodada — adicionado lá como pendência de confirmação de significado de negócio.

**Geolocalização silenciosa:** só roda se não houver `?cidade=`; usa Nominatim (OpenStreetMap) para reverse geocode; falha silenciosa em qualquer erro/negação de permissão.

**Prioridade de cidade efetiva:** `URL > cidade extraída da busca > geolocalização`.

### `PrestadorCard.tsx`

Reaproveita `getIniciais`, `getLocalizacao`, `getPerfilHref` de `lib/prestadorUtils.ts`. Link de perfil carrega `?from=` com o pathname+search atual. "É você?" inline para `origem_tipo: 'curadoria_publica'`. Fallback de imagem via `onError`.

### 🐛 Bug corrigido: `getPerfilHref` — tipo incompatível

`prestadores.id` é `bigint`/`number`, mas `getPerfilHref` declarava `id: string`. Assinatura corrigida para `string | number` — corpo da função não mudou (template literal já convertia em runtime).

### Log de atividades — `insertLog` + `checkLogExists`

`hooks/useLog.ts` centraliza escrita em `logs_atividades`, capturando usuário da sessão automaticamente. `checkLogExists(usuarioId, acao)` foi adicionada mas ainda sem nenhum ponto de uso identificado no código revisado.

### Peças ainda não documentadas deste módulo

| Peça | Status |
|---|---|
| `lib/buscaUtils.ts` (`normalizarTermo`, `filtrarPrestadores`) | Não revisado |
| `lib/ordenacao.ts` (`pesoOrdenacao`) | Não revisado |
| `lib/db/prestadores.ts`, `lib/db/categorias.ts` | Não revisados |
| Significado de negócio de `origem_tipo: 'vitrine'` | Não confirmado |

---

## Sistema de Anúncios (frontend)

Backend (leilão CPC, segmentação) documentado em `03-banco-de-dados.md`.

### `AdCard.tsx`

Dois modos: AdSense real (`<ins className="adsbygoogle">`, com checagem de 2s + `offsetHeight` para detectar bloqueio/adblock) ou `AdCardFallback`.

### 💡 Decisão de produto: fallback como canal de contato direto

Hoje `AdCard` é sempre chamado com `anuncio={null}` — cai sempre no fallback, configurado para direcionar ao WhatsApp do fundador. Racional: sem tráfego significativo ainda, não compensa operacionalizar o leilão real; o espaço de anúncio funciona como CTA comercial direto enquanto a base cresce. Infraestrutura de leilão já pronta no banco, só falta o "encanamento" de popular `anuncio` a partir de uma query real.

### `AdPage` — posições confirmadas

`'prestadores'`, `'perfil_prestador'` (agora corrigido, ver Portfólio Público), `'lista_topo'` em uso. `'busca_servicos'` ainda não visto.

### Peças ainda não documentadas

`useAdContext`, `AdCardFallback.tsx`, conteúdo real do `AdFallback` configurado, ponto de integração real com `anuncios`/`anunciantes`.