# Módulos — PQF

Complementa `02-arquitetura.md`. Para localizar um conceito específico (ex: "avatar", "WhatsApp", "status de projeto") em todos os módulos que o tocam, ver `08-glossario.md`.

---

## Cadastro de Prestador

**Rota:** `app/cadastro/page.tsx` (JSX puro) + `hooks/useCadastroPrestador.ts` + `lib/services/cadastroPrestador.service.ts`

Um único formulário multiuso cobrindo três cenários, decididos em tempo de execução:

1. **Cadastro novo** — sem sessão e sem registro em `prestadores`
2. **Edição de perfil existente** (`modoEdicao`) — logado com registro próprio
3. **Reivindicação de perfil** (`?reivindicar=<id>`) — assume perfil de curadoria pública sem `user_id`

**Hooks orquestrados:** `usePrestadorForm` (estado do form), `useCategorias`, `useLocalizacao`, `useSlugCheck` (debounce 500ms via `verificarSlugDisponivel`).

**Subcomponentes de seção** (`components/perfil/`), reaproveitados no Cadastro e na Edição (dashboard): `FotoUpload`, `SecaoDadosPessoais`, `SecaoOQueVoceFaz`, `SecaoLocalizacao`, `SecaoTermos` (com links reais para `/termos`/`/privacidade`).

**Fluxo de inicialização** (roda uma vez via `inicializadoRef`):
```
Verifica sessão → tem prestador ativo (não pendente, não curadoria)? → /dashboard
Carrega listas base (grupos, habilidades, estados) em paralelo
Tem ?reivindicar=<id>?
  ├─ Sim → busca prestador específico; já reivindicado por outro → modal; sem user_id → carrega no form
  ↓ Não
Tem prestador próprio? → carrega no form, modoEdicao=true
  ↓ Não → pré-preenche nome do Google, região padrão PR
```

**Autenticação embutida no formulário:** diferente de `/login`, o cadastro de conta acontece no mesmo formulário (`SecaoAcessoCadastro`/`SecaoAcessoLogado`, ambos usando `components/auth/SenhaInput.tsx`). É um segundo ponto de criação de conta, além de `/login`.

**Submit:** valida → `criarContaEmail`/`loginEmail` (se sem sessão) → `atualizarSenha` (se logado trocando) → limpa cidades duplicadas da sede → `deletarOutrosPrestadoresDoUsuario` (se reivindicando) → `upsertPrestador` → `loginEmail` (garante sessão) → `window.location.href = '/dashboard'` (hard redirect, força `useAuth` reprocessar do zero).

**Exclusão de perfil** (distinta de exclusão de conta completa): `handleExcluirPerfil` → `deletarPrestador`, cascata via FK.

**Pendência de tipagem:** `PrestadorRow` (tipo estendido local) cobre a ausência de `user_id` em `PrestadorFormData` — ver `03-banco-de-dados.md`.

**Prefill de credenciais:** `sessionStorage.pqf_prefill` é gravado por `useLoginForm.ts` sempre que o destino pós-login é `/cadastro`, e lido/removido aqui no estado inicial de `email`/`senha`.

---

## Dashboard do Prestador

**Route group:** `app/(dashboard)/dashboard/`

```
layout.tsx    → DashboardLayout, header com botão voltar dinâmico via ?origem=
page.tsx      → Dashboard raiz
perfil/page.tsx → PerfilPage, abas "Meus Projetos"/"Dados Profissionais"
```

**`usePerfilStatus`** — gatekeeper: `cadastroCompleto = !!(nome && whatsapp && categoria_id)` (3 campos mínimos, mais permissivo que o form de cadastro completo). Usa `buscarPrestadorPorUserId` (`cadastroPrestador.service.ts`).

**Abas:** "Meus Projetos" (`PortfolioDashboardTab`, bloqueada se `!cadastroCompleto`) / "Dados Profissionais" (`EditarPerfilTab`, nunca bloqueada). "Ver meu perfil" (link `/${slug}`) só aparece com slug.

### `EditarPerfilTab.tsx`

Reaproveita hooks/seções do Cadastro. Promove `ativacao_status` automaticamente para `perfil_completo` quando os campos obrigatórios ficam completos e o status atual é `nao_enviado`/ausente (não sobrescreve estados vindos de outro fluxo).

**Exclusão de conta:** `handleExcluirContaTotal` própria — remove foto, deleta `prestadores`, chama `/api/delete-account`, `signOut`. Funcionalmente equivalente ao fluxo único (`/confirmar-exclusao`) mas não migrada para ele.

### `PortfolioDashboardTab.tsx`

Orquestra `usePortfolioDashboard` (usa `portfolioDashboard.service.ts`). Alterna entre visão lista (`PrestadorSideCard` + `DashboardHeader` + grid de `ProjetoCard`/`EstadoVazio`) e visão wizard (`UploadWizardContainer`, `key` por projeto para reset de estado).

**`ProjetoCard.getStatusConfig`** — mapeia `status` + presença de avaliação em 5 rótulos: Rascunho, Aguard. cliente, Em progresso, Concluído, Aguard. avaliação. Derivação de UI, não status de banco.

### `components/dashboard/wizard/`

- **`UploadWizardContainer.tsx`** — ativo, hero azul + form + timeline inline (não usa os subcomponentes abaixo ainda)
- **`WizardCompleted.tsx`** — exibido quando `isProjetoConcluido`, mostra fotos + comentários do cliente + compartilhar
- **`WizardZoomModal.tsx`** — edição de legenda + upload de foto por etapa, usa `ModalFotoBase` (`components/shared/`)
- **`WizardForm.tsx`, `WizardTimeline.tsx`** — peças de refatoração prontas mas não integradas em `UploadWizardContainer`

Todo o módulo é orquestrado por **`hooks/useUploadWizard.ts`** + **`lib/services/uploadWizard.service.ts`**. Pontos de atenção do hook:
- `fotosCarrossel` estabilizado via `useMemo` (evita loop de re-render)
- Sincronização de status usa `useRef` para status atual, evitando incluí-lo nas deps do `useEffect` (evitaria loop infinito de requisições)
- `gerarLinkAceite`/`gerarLinkConclusao` montam link `wa.me` com mensagem pré-formatada; `gerarLinkConclusao` usa o `token` de avaliação no path (`/avaliar/${token}`), não o `projetoId`

### `PrestadorSideCard.tsx`

Card de identidade + dados profissionais na sidebar. Link "Ver meu perfil" → `/${slug}` (rota raiz, não `/p/${slug}`).

### `AnunciosTab.tsx`

Card estático direcionando ao WhatsApp institucional (`lib/config/contato.ts`), com mensagem própria de prestador interessado em destaque de perfil — distinto do módulo de anúncios para lojistas (ver seção Anúncios abaixo).

---

## Painel do Cliente

**Rota:** `app/painel/perfil/page.tsx` (dados) e `app/meus-servicos/page.tsx` (lista de serviços)

### `PerfilDoCliente` (`app/painel/perfil/page.tsx`)

**Hook:** `usePerfilCliente`, compondo `usePerfilDados` (dados pessoais, avatar — não trata exclusão de conta), `useServicosCliente` (busca por whatsapp, filtros, `getRotaDestino`), `usePerfilUI` (aba ativa, modal de saída com alterações não salvas via `beforeunload`).

**Roteamento contextual** (`getRotaDestino`):
```
status='pendente' → /meus-servicos?token=...
status='em_execucao' sem foto 3 → /acompanhamento/[token]
status='em_execucao' com foto 3 → /avaliar/[token]
default → /avaliar/[token]
```

**Exclusão de conta:** botão na Zona de Perigo linka para `/confirmar-exclusao` (fluxo único, ver `04-autenticacao.md`).

### `PainelDoCliente` (`app/meus-servicos/page.tsx`)

**Hook:** `usePainelCliente` + `lib/services/painelCliente.service.ts` (`getProfile`, `getServicoPorToken`, `getServicosPorWhatsapp`, `aceitarServico`, `loginComGoogle`).

Acesso via `?token=` ou fallback por whatsapp salvo. `LoginGate` (`components/meus-servicos/LoginGate.tsx`) se sem sessão — usa `loginComGoogle` deste service (não passa por `useGoogleAuth`).

Filtros: Todos/Pendentes/Em andamento/Concluídos. `handleAceitar` atualiza `status: 'em_execucao'` + feedback otimista local + `router.push` (sem hard reload).

**Query centralizada:** `STATUS_VISIVEIS = ['em_registro', 'pendente', 'em_execucao', 'finalizado']` — só os 4 valores reais.

**`ServicoCard.tsx`** — card de projeto, botão de contato usa `buildLinkWhatsapp` (`lib/utils/whatsapp.ts`).

**`LoginGate.tsx`, `ZoomImageModal.tsx`** — apresentacionais.

---

## Portfólio Público (perfil `[slug]`)

**Rota:** `app/[slug]/page.tsx` → `PerfilPublico` → `PerfilCarregado`

Duas colunas: `PerfilHero` + ações à esquerda; `PerfilSobre`, `PerfilCTA`, `PortfolioGrid`, `PerfilAvaliacoes` à direita.

**`usePerfilPrestador`** — duas queries: `prestadores` com joins (`cidades`, `categorias`, `portfolio_projetos`+`portfolio_fotos`+`avaliacoes.indica`) filtrado por `slug`/`id`; e `avaliacoes` separada (`visivel=true`, limite 10). Só `em_execucao`/`finalizado` aparecem publicamente; finalizados primeiro.

**`?from=`** captura origem da busca (log `VISITA_PERFIL_VIA_BUSCA`), removido da URL via `history.replaceState`. Sem `?from=`, monta `/prestadores?q=<categoria>`. Nome diverge de `?origem=` (dashboard) — mesma ideia, nomes diferentes.

**`PerfilHero.tsx`** — avatar, chips (categoria, projetos concluídos/em andamento, média de avaliação via `useAvaliacoes`), ações (denunciar, compartilhar via `useCompartilharPerfil`).

**`PerfilCTA.tsx`** — botão de WhatsApp (link + botão flutuante persistente via `IntersectionObserver`), usa `buildLinkWhatsapp` com mensagem de orçamento.

**`ProjetoModal.tsx`** — abre a partir de `PortfolioGrid`, usa `ModalFotoBase`, navegação via `useSlides`, comentários via `useComentariosFoto` (usa `getComentariosDaFoto` de `uploadWizard.service.ts`).

**`useCompartilharPerfil`** + `lib/services/compartilharPerfil.service.ts`: funções puras de URL/texto (`buildUrlPerfil`, `buildTextoPadrao`, `buildTextoWhatsApp`) + efeitos (`compartilharViaNative` — restrito a mobile via `pointer: coarse`, `compartilharViaWhatsApp`, `registrarCompartilhamento` via `insertLog`).

**`RastreamentoAtivacaoProvider`** — Suspense wrapper invocando `useRastreamentoAtivacao` a partir de `?src=`.

---

## Avaliação

**Rota:** `app/avaliar/[token]/page.tsx` + `hooks/useAvaliacao.ts` (export `useAvaliar`) + `lib/services/avaliacao.service.ts`

Reaproveita `CardPrestador`/`RodapeSeguranca` do Acompanhamento. `CarrosselFinalizacao` (3 fotos finais) + `BlocoAvaliacao` (nota/comentário/indica).

**Submit** (`handleFinalizarAvaliacao`): `inserirAvaliacao` (`status: 'finalizado'`, `visivel: true`) → `finalizarProjeto` → `router.push('/sucesso')`. Se `avaliacaoExistente?.status === 'finalizado'`, oculta `BlocoAvaliacao`.

### `FormularioAvaliacao.tsx` (ativo, `components/profile/`)

Delega a `useSubmitAvaliacao` (`lib/services/avaliacao.service.ts` + `uploadWizard.service.ts` para upload). Checkbox "Reportar problema/Solicitar Garantia" ativa modo contestação: oculta estrelas, ativa `FotosEvidenciaPicker` (upload múltiplo, `MAX_ARQUIVOS`, preview com `useMemo`+`revokeObjectURL` para evitar vazamento de memória). Submit grava `nota:1`, `em_disputa:true`, `visivel:false`, cria linha em `contestacoes` + `marcarProjetoEmDisputa`.

Este fluxo de contestação é distinto do fluxo linear pós-serviço (`useAvaliar`) — ponto de renderização real ainda não totalmente mapeado.

### `AvaliacoesTab`/`AvaliacaoCard`/`AvaliacoesResumo`

Não conectados a nenhuma tela. `PerfilAvaliacoes` (em produção) esconde a seção quando vazia; `calcularStats` (`lib/utils/avaliacao.utils.ts`) só marca `exibir: true` com 10+ avaliações — decisão de produto para o volume atual.

---

## Acompanhamento do Cliente

**Rota:** `app/acompanhamento/[token]/page.tsx` + `hooks/useAcompanhamento.ts`

Acesso via `avaliacao_token`, sem login. Duas colunas: `CardPrestador`+`StatusMini`+`RodapeSeguranca` / `LinhaDeTempo`.

**`LinhaDeTempo.tsx`** usa `TimelineVertical` (`components/shared/`, compartilhado com o wizard do prestador). Cada nó clicável abre `ModalDiscussao` (comentários por foto, `onKeyDown` de Enter valida campo não-vazio, consistente com o botão de envio).

**Componentes de `components/acompanhamento/`** — todos puramente apresentacionais, sem I/O direto:

| Componente | Papel |
|---|---|
| `CardPrestador.tsx` | Card do prestador + contato (usa `buildLinkWhatsapp`) + rótulo de status dinâmico conforme `projeto.status` |
| `CarrosselFinalizacao.tsx` | Carrossel de fotos finais (tela de Avaliação) |
| `LinhaDeTempo.tsx` | Timeline do cliente, badge de status por 3 estados reais |
| `ModalDiscussao.tsx` | Chat por foto (comentários cliente/prestador) |
| `BlocoAvaliacao.tsx` | Formulário de nota/comentário/indica |
| `RodapeSeguranca.tsx` | Estático, sem props |
| `StatusMini.tsx` | Dois cards de resumo (progresso, registros) |

---

## Reivindicação de Perfil

**Rota:** `app/reivindicar/page.tsx` — puramente apresentacional, sem I/O. Redireciona para `/cadastro?reivindicar=<id>`, toda lógica real vive no Cadastro.

## Página de Sucesso

**Rota:** `app/sucesso/page.tsx` — estática. Botão "Compartilhar Resultado" usa `navigator.share`/fallback de clipboard com texto genérico (a página não recebe dados do projeto/prestador avaliado — pendência de personalização, ver roadmap).

## Denúncia

**Rota:** `app/denunciar/[id]/page.tsx` + `lib/services/denuncia.service.ts` (`criarDenuncia`). Formulário → tabela `denuncias` (`status: 'aberta'`). Aviso de "banimento por denúncia falsa" é só texto informativo.

## Exclusão de Conta

**Rota:** `app/confirmar-exclusao/page.tsx` — ver `04-autenticacao.md`.

## Chat em tempo real

**Decisão de produto: não implementado.** WhatsApp já cumpre esse papel. Nenhum código ativo referencia `projeto_mensagens`. Comentários pontuais por foto (`portfolio_comentarios`, via `ModalDiscussao`/`WizardZoomModal`) são o mecanismo de feedback assíncrono do produto.

---

## Busca e Listagem de Prestadores

Dois pontos de entrada: home (busca inicial) e `/prestadores` (resultados).

### Home — `app/page.tsx`

`Home` → `HeroSection` (dynamic, `ssr: false`, envolve `HeaderBotoes`) + `SearchForm`.

**Submit:** sem termo → erro 3s; com termo → `insertLog('BUSCA_REALIZADA')` → `router.push('/prestadores?q=<termo>')`. CTA "É prestador de serviços?" → `/login`, loga `CLIQUE_CTA_PRESTADOR` (distinto de `CLIQUE_SOU_PROFISSIONAL`, logado pelo botão homônimo no header).

**Sugestões (`useSugestoes`):** sem debounce inicial, 300ms ao digitar. `lib/db/categorias.ts` (`getSugestoesDestaque`/`getSugestoesPorBusca`), fallback em `config/categorias.ts` (`SUGESTOES_FALLBACK`).

### `/prestadores` — Listagem

**Parâmetros:** `q`, `habilidade`, `cidade`. Chips de cidade contam por `cidade_nome`/`cidades_atendidas` (um prestador pode contar em mais de um chip).

**Anúncios:** `AdCard` no topo (`lista_topo`) e a cada 5 prestadores (`prestadores`), `categoria={queryBusca || filtroHab}`.

**`usePrestadores`** — carrega `prestadores` ativos + médias de avaliação em paralelo (`AbortSignal`), recalcula médias em JS (não usa `prestadores_ranqueados`). Parsing de busca com cidade embutida (`"pedreiro em Londrina"` → regex), sincroniza `?cidade=` via `router.replace` silencioso. `origem_tipo='vitrine'` sempre no topo, sem filtro. Geolocalização silenciosa via Nominatim só roda sem `?cidade=`. Prioridade: `URL > cidade extraída > geolocalização`.

Usa `useSession()` (não `useAuth()`) para passar sessão a `PrestadorCard`.

**`PrestadorCard.tsx`** — `getIniciais`/`getLocalizacao`/`getPerfilHref` (`lib/prestadorUtils.ts`, `id` tipado `string | number`). Link carrega `?from=`. "É você?" para `curadoria_publica`. Fallback de imagem via `onError`.

**Peças não revisadas:** `lib/buscaUtils.ts`, `lib/ordenacao.ts`, `lib/db/prestadores.ts` (parcialmente visto), `lib/db/categorias.ts`. Significado de negócio de `origem_tipo: 'vitrine'` não confirmado formalmente.

---

## Sistema de Anúncios

Ver `08-glossario.md`, seção Anúncios, para a distinção entre os dois sistemas (lojista/fornecedor vs. destaque de perfil do prestador).

**`AdCard.tsx`** — modo AdSense real (checagem 2s + `offsetHeight` para adblock) ou fallback. **`AdCardFallback.tsx`** — renderiza `fallback` (cor/emoji/título/subtítulo/cta/href) vindo de `useAdContext`.

**`useAdContext.ts`** → `resolverSegmento` (`lib/ads/categoria-segmento.ts`) + `getFallbackPorSegmento` (`lib/ads/fallbacks.ts`, 8 segmentos + `geral`). Recalculado via `useState` com inicializador — não reage a mudanças de `categoria` após a primeira renderização (candidato a `useMemo` se o fallback precisar acompanhar filtros de busca dinâmicos).

Hoje sempre em modo fallback, direcionando ao WhatsApp institucional (`lib/config/contato.ts`).

**Peças não revisadas:** ponto de integração real com `anuncios`/`anunciantes` (backend pronto, sem "encanamento" no frontend).