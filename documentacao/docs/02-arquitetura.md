# Arquitetura — PQF

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router) |
| Linguagem | TypeScript |
| Banco de dados | Supabase (Postgres) |
| Autenticação | Supabase Auth (Google OAuth) |
| Autorização | Row Level Security (RLS) no Postgres |
| Estilo | Tailwind CSS |
| Deploy | Vercel |
| Testes unitários | Vitest |
| Testes E2E | Playwright |
| Analytics | PostHog |

## Estrutura de pastas (raiz)

```
procuro-quem-faca/
├── app/                  # Rotas (App Router)
├── components/           # Componentes React organizados por domínio
├── config/               # Configurações estáticas (ex: categorias.ts)
├── documentacao/         # Documentação do projeto (este diretório)
├── hooks/                # Hooks customizados — lógica de estado e efeitos
├── lib/                  # Services, utils, contexts, acesso a dados
├── public/               # Assets estáticos
├── supabase/             # Migrations / configuração do Supabase
├── tests/                # Testes (Vitest + Playwright)
└── types/                # Tipos TypeScript compartilhados
```

## Padrão arquitetural: Hook → Service → Supabase

```
Componente (UI)
     ↓
Hook customizado (estado, efeitos, orquestração)
     ↓
Service (chamadas ao Supabase, uma função por operação)
     ↓
Supabase (Postgres + RLS)
```

**Exemplo real — módulo de upload de portfólio:**

- `components/dashboard/wizard/UploadWizardContainer.tsx` → UI, recebe tudo via `hookData`
- `hooks/useUploadWizard.ts` → estado (fotos, legendas, projeto atual), efeitos (sincronização de status), ações (`handleUpload`, `handleSalvarLegenda`)
- `lib/services/uploadWizard.service.ts` → funções isoladas (`upsertFotoProjeto`, `atualizarLegendaFoto`, `uploadImagemPortfolio`)

Essa separação existe para:
- Permitir testar a lógica de negócio (hook) sem precisar renderizar componentes
- Isolar chamadas ao Supabase em um único lugar por domínio
- Manter componentes como puramente apresentacionais

Componentes de página (`app/**/page.tsx`) tendem a ser wrappers finos que consomem um hook central; a lógica de estado e efeitos vive no hook; o I/O vive no service. Ver `08-glossario.md` para localizar rapidamente o hook/service correspondente a um conceito específico (ex: "avatar", "WhatsApp", "logout", "status de projeto").

### Módulos com peças construídas mas não conectadas

- **`lib/contexts/LocationContext.tsx` + `components/location/LocationModal.tsx`** — modal de seleção obrigatória de cidade via cookie. `LocationProvider` nunca envolve a árvore em `app/layout.tsx`. Decisão consciente de não conectar: a busca por texto livre (`"pedreiro em Londrina"`, via `usePrestadores`) já cobre a necessidade no estágio mono-região atual. Ver `08-glossario.md`, seção Localização.
- **`components/dashboard/WizardForm.tsx`, `WizardTimeline.tsx`, `PrestadorCardHorizontal.tsx`** — peças de uma refatoração do wizard do prestador, prontas mas não integradas em `UploadWizardContainer.tsx` (que ainda tem hero/form/timeline inline).
- **`components/profile/AvaliacoesTab.tsx`, `AvaliacaoCard.tsx`, `AvaliacoesResumo.tsx`** — conjunto de exibição de avaliações com distribuição por nota, não conectado a nenhuma tela. `calcularStats` (`lib/utils/avaliacao.utils.ts`) só marca `exibir: true` com 10+ avaliações — decisão de produto para não expor distribuição com baixo volume.

## `app/` — Rotas principais

| Rota | Propósito |
|---|---|
| `(admin)` | Área administrativa (inclui gestão de geografia) |
| `(dashboard)` | Dashboard do prestador |
| `(perfil)` | Perfil público/privado |
| `acompanhamento` | Cliente acompanha progresso do serviço |
| `ads` | Anúncios/banners |
| `avaliar` | Fluxo de avaliação pós-serviço |
| `cadastro` | Cadastro de prestador |
| `confirmar-exclusao` | Exclusão de conta — cliente e prestador (ver `04-autenticacao.md`) |
| `denunciar` | Denúncia de prestador/conteúdo |
| `login` | Autenticação |
| `meus-servicos` | Cliente visualiza serviços contratados |
| `painel` | Painel do prestador (perfil, configurações) |
| `prestadores` | Listagem/busca de prestadores |
| `recuperar-senha`, `reivindicar`, `sucesso`, `termos`, `privacidade` | Fluxos de suporte e institucional |

Rotas entre parênteses são **route groups** do Next.js: organizam código sem afetar a URL.

## `components/` — Organização por domínio

```
components/
├── acompanhamento/    # Tela de acompanhamento do cliente
├── ads/               # Anúncios (lojista/fornecedor)
├── auth/              # Login, cadastro de acesso, componentes de senha
├── cards/             # Cards de listagem (prestador, projeto)
├── dashboard/         # Dashboard do prestador (inclui wizard/)
├── home/              # Landing page
├── location/          # Modal de seleção de cidade (não conectado)
├── meus-servicos/     # Painel do cliente (aceitar/gerenciar projetos)
├── perfil/            # Área logada do cliente + seções reutilizáveis do form de prestador
├── profile/           # Perfil público + módulo de avaliação
├── shared/            # Compartilhados entre domínios (ModalFotoBase, TimelineVertical)
├── skeletons/         # Loading states
└── ui/                # Primitivos de UI (modais, rating stars)
```

`components/perfil/` e `components/profile/` **não são duplicação**: `perfil/` mistura componentes de área logada do cliente (`HeaderCliente`, `CardPerfilCliente`) com seções reutilizáveis do form de prestador (`SecaoDadosPessoais`, `SecaoLocalizacao`, `SecaoOQueVoceFaz`, `SecaoTermos`, `FotoUpload`), usadas tanto no Cadastro quanto na Edição. `profile/` é o perfil público e módulo de avaliação (`PerfilHero`, `PortfolioGrid`, `ProjetoModal`, `FormularioAvaliacao`, `AvaliacoesTab`). Nomenclatura inconsistente (PT vs EN) mas responsabilidades distintas.

## `hooks/` — Um hook por responsabilidade

- **Autenticação/sessão:** `useAuth` (completo: session+role+prestadorStatus+sessionChecked), `useSession` (mínimo: só session), `useLoginForm`, `useLogout`, `useGoogleAuth`
- **Perfil/prestador:** `usePerfilPrestador`, `usePerfilStatus`, `usePerfilUI`, `usePrestadorForm`, `usePrestadores`, `useCadastroPrestador`, `useSlugCheck`
- **Cliente:** `usePerfilCliente`, `usePerfilDados`, `usePainelCliente`, `useServicosCliente`
- **Portfólio/avaliação:** `useUploadWizard`, `usePortfolioDashboard`, `useAvaliar` (arquivo `useAvaliacao.ts`), `useAvaliacoes`, `useSubmitAvaliacao`, `useComentariosFoto`, `useAcompanhamento`
- **Suporte/UX:** `useCookieConsent`, `useSlides`, `useSugestoes`, `useCompartilharPerfil`
- **Localização:** `useLocalizacao`, `useHeaderCliente`
- **Categorias/anúncios:** `useCategorias`, `useAdContext`
- **Rastreamento:** `useRastreamentoAtivacao`
- **Exclusão de conta:** `useConfirmarExclusaoConta`

Ver `08-glossario.md` para mapear um conceito a todos os hooks/componentes que o tocam.

## `lib/` — Acesso a dados e utilitários

```
lib/
├── ads/          # Segmentação de anúncios (categoria-segmento.ts, fallbacks.ts)
├── auth/         # resolverDestinoPosLogin.ts — decisão pura de destino pós-login
├── config/       # Contato institucional (contato.ts)
├── contexts/     # React Contexts (LocationContext — não conectado)
├── db/           # Acesso a tabelas de infraestrutura (logs.ts, acessos.ts, categorias.ts, geografia.ts, prestadores.ts)
├── scripts/      # Scripts auxiliares (ex: AdSense)
├── services/     # Camada de service — uma chamada Supabase por função
└── utils/        # Funções puras (whatsapp.ts, mascaras.ts, avaliacao.utils.ts)
```

**`lib/db/` vs `lib/services/`:**
- `db/` → acesso direto a tabelas de infraestrutura/cross-cutting (logs, acessos, geografia, categorias de sugestão)
- `services/` → operações de domínio de produto, orquestradas por hooks

**Services existentes:** `auth.service.ts`, `avaliacao.service.ts`, `cadastroPrestador.service.ts`, `categorias.service.ts`, `cliente.service.ts`, `compartilharPerfil.service.ts`, `denuncia.service.ts`, `exclusaoConta.service.ts`, `localizacao.service.ts`, `painelCliente.service.ts`, `portfolioDashboard.service.ts` (re-exporta funções de `uploadWizard.service.ts`), `recuperacaoSenha.service.ts`, `uploadWizard.service.ts`.

## `types/` — Tipos compartilhados por domínio

Um arquivo de tipos por área de produto: `ads.ts`, `avaliacao.ts`, `categorias.ts`, `localizacao.ts`, `painel.ts`, `perfil.ts`, `portfolio.ts`, `prestador.ts`.

**Nota de tipagem:** `Prestador`/`PrestadorFormData` (`types/prestador.ts`) não incluem `user_id`, embora seja campo real e indexado da tabela `prestadores`. Contornado localmente em `cadastroPrestador.service.ts` com um tipo estendido (`PrestadorRow`).

## `config/`

`categorias.ts` — taxonomia de serviço + `SUGESTOES_FALLBACK` (autocomplete da busca).

## Testes

- **Vitest** (`vitest.config.ts`, `tests/`) → testes unitários, principalmente hooks e services
- **Playwright** (`playwright.config.ts`) → testes E2E de fluxos completos

## Convenções de código

- Imports internos por alias `@/...`, não relativos
- Comentários `// FIX: ...` explicando bugs corrigidos e o motivo
- Nomenclatura em português para domínio de negócio, inglês para termos técnicos genéricos
- Quando duas versões do mesmo componente coexistem (`.js` legado + `.tsx` ativo), a versão `.tsx` integrada ao padrão Hook→Service é a ativa