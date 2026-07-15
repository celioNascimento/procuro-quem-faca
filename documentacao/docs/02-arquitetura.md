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

O projeto segue uma separação em camadas consistente, mais visível nos módulos mais recentes (ex: upload wizard, portfolio):

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

- `components/portfolio/.../UploadWizard.tsx` → UI pura, recebe tudo via hook
- `hooks/useUploadWizard.ts` → estado (fotos, legendas, projeto atual), efeitos (sincronização de status), ações (`handleUpload`, `handleSalvarLegenda`)
- `lib/services/uploadWizard.service.ts` → funções isoladas (`upsertFotoProjeto`, `atualizarLegendaFoto`, `uploadImagemPortfolio`), cada uma fazendo uma query/operação específica

Essa separação existe para:
- Permitir testar a lógica de negócio (hook) sem precisar renderizar componentes
- Isolar chamadas ao Supabase em um único lugar por domínio, facilitando trocar client ou adicionar retry/cache depois
- Manter componentes como puramente apresentacionais

**Nem todo módulo antigo segue esse padrão à risca** — alguns hooks mais antigos ainda fazem chamadas diretas ao Supabase. Ao tocar em código legado, prefira migrar para o padrão service quando fizer sentido, sem forçar refatoração completa fora de escopo.

## `app/` — Rotas principais

| Rota | Propósito |
|---|---|
| `(admin)` | Área administrativa |
| `(dashboard)` | Dashboard do prestador |
| `(perfil)` | Perfil público/privado |
| `acompanhamento` | Cliente acompanha progresso do serviço |
| `ads` | Anúncios/banners |
| `avaliar` | Fluxo de avaliação pós-serviço |
| `cadastro` | Cadastro de prestador |
| `confirmar-exclusao` | Confirmação de exclusão de conta |
| `denunciar` | Denúncia de prestador/conteúdo |
| `login` | Autenticação |
| `meus-servicos` | Cliente visualiza serviços contratados |
| `painel` | Painel do prestador (perfil, configurações) |
| `prestadores` | Listagem/busca de prestadores |
| `projeto` | Detalhe de um projeto/serviço |
| `recuperar-senha`, `reivindicar`, `sucesso`, `termos`, `privacidade` | Fluxos de suporte e institucional |

Rotas entre parênteses — `(admin)`, `(dashboard)`, `(perfil)` — são **route groups** do Next.js: organizam código sem afetar a URL.

## `components/` — Organização por domínio

Componentes são agrupados por área de produto, não por tipo genérico:

```
components/
├── acompanhamento/   # Tela de acompanhamento do cliente
├── admin/             # Área administrativa
├── ads/               # Anúncios
├── auth/              # Login, botões de autenticação
├── cards/             # Cards de listagem (prestador, projeto)
├── dashboard/         # Dashboard do prestador
├── home/              # Landing page
├── location/          # Seleção/detecção de localização
├── meus-servicos/      # Serviços do cliente
├── perfil/, profile/  # Perfil — ver observação abaixo
├── shared/            # Compartilhados entre domínios (ex: ModalFotoBase)
├── skeletons/         # Loading states
├── ui/                # Primitivos de UI (botões, inputs genéricos)
└── vistas/            # Views compostas
```

> ✅ **Resolvido: `components/perfil/` e `components/profile/` NÃO são duplicação.** Nota anterior estava incorreta — após revisar o conteúdo completo das duas pastas, elas têm propósitos distintos: `perfil/` mistura componentes de área logada do **cliente** (`HeaderCliente`, `CardPerfilCliente`) com as seções reutilizáveis do formulário de **prestador** (`SecaoDadosPessoais`, `SecaoLocalizacao`, `SecaoOQueVoceFaz`, `SecaoTermos`, `FotoUpload`), usadas tanto no Cadastro quanto na Edição de Perfil. `profile/` é especificamente o **perfil público** e módulo de **avaliação** (`PerfilHero`, `PerfilSobre`, `PortfolioGrid`, `ProjetoModal`, `FormularioAvaliacao`, `AvaliacoesTab`). É nomenclatura inconsistente (uma pasta em português, outra em inglês) para conjuntos de responsabilidade diferentes — não candidata a fusão. Item removido do roadmap de limpeza.

## `hooks/` — Um hook por responsabilidade

Cada hook tem uma responsabilidade única e nomeada pelo domínio que orquestra:

- **Autenticação/sessão:** `useAuth`, `useSession`, `useLoginForm`, `useLogout`, `useGoogleAuth`
- **Perfil/prestador:** `usePerfilPrestador`, `usePerfilStatus`, `usePerfilUI`, `usePrestadorForm`, `usePrestadores`
- **Cliente:** `usePerfilCliente`, `usePerfilDados`, `usePainelCliente`, `useServicosCliente`
- **Portfólio/avaliação:** `useUploadWizard`, `usePortfolioDashboard`, `useAvaliacao` (função `useAvaliar`), `useAvaliacoes`, `useSubmitAvaliacao`, `useComentariosFoto`
- **Suporte/UX:** `useCookieConsent`, `useLog`, `useSlides`, `useSugestoes`, `useCompartilharPerfil`, `useSlugCheck`
- **Localização:** `useLocalizacao`, `useHeaderCliente` (geolocalização silenciosa)
- **Categorias/anúncios:** `useCategorias`, `useAdContext`
- **Rastreamento:** `useRastreamentoAtivacao`, `useAcompanhamento`

## `lib/` — Acesso a dados e utilitários

```
lib/
├── ads/          # Lógica de segmentação de anúncios, fallbacks
├── auth/          # resolverDestinoPosLogin.ts — decisão pura de destino pós-login
├── contexts/     # React Contexts (ex: LocationContext)
├── db/           # Funções de acesso a tabelas específicas (acessos, logs, geografia)
├── scripts/      # Scripts auxiliares (ex: AdSense)
├── services/     # Camada de service — uma chamada Supabase por função
└── utils/        # Funções puras (máscaras, formatação, ordenação, cookies)
```

**`lib/db/` vs `lib/services/`** — distinção importante:
- `db/` → acesso direto a tabelas de infraestrutura/cross-cutting (logs, cookies, geografia, acessos)
- `services/` → operações de domínio de produto, orquestradas por hooks (auth, avaliação, cliente, portfolio, painel do cliente)

## `types/` — Tipos compartilhados por domínio

Um arquivo de tipos por área de produto: `ads.ts`, `avaliacao.ts`, `categorias.ts`, `localizacao.ts`, `painel.ts`, `perfil.ts`, `portfolio.ts`, `prestador.ts`.

## `config/`

Configurações estáticas versionadas no código (não no banco), como `categorias.ts` — a taxonomia de categorias de serviço usada em toda a aplicação.

## Testes

- **Vitest** (`vitest.config.ts`, `tests/`) → testes unitários, principalmente na camada de hooks e services (ex: sistema de log de atividades)
- **Playwright** (`playwright.config.ts`) → testes E2E de fluxos completos

## Convenções de código observadas

- Preferência por **reescrita completa de arquivo** em vez de diffs parciais, especialmente em sessões via mobile
- Comentários `// FIX: ...` deixados no código explicando bugs corrigidos e o motivo — útil para não reintroduzir o mesmo bug
- Nomenclatura em português para domínio de negócio (`prestadores`, `avaliacao`, `cadastro`), inglês para termos técnicos genéricos
- Quando duas versões do mesmo componente coexistem (`.js` legado + `.tsx` ativo, ex: `FormularioAvaliacao`), a versão `.tsx` que integra hooks/services do padrão arquitetural acima é a ativa — a `.js` costuma ser um protótipo anterior com lógica inline