# Dashboard do Prestador — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Route group:** `app/(dashboard)/dashboard/`

```
layout.tsx    → DashboardLayout, header com botão voltar dinâmico via ?origem=
page.tsx      → Dashboard raiz, abas "Meus Projetos"/"Dados Profissionais"
perfil/page.tsx → redireciona para /dashboard?aba=perfil (ver nota abaixo)
```

**`usePerfilStatus`** — gatekeeper: `cadastroCompleto = !!(nome && whatsapp && categoria_id)` (3 campos mínimos, mais permissivo que o form de cadastro completo). Usa `buscarPrestadorPorUserId` (`cadastroPrestador.service.ts`).

**Abas** (em `page.tsx`): "Meus Projetos" (`PortfolioDashboardTab`, bloqueada se `!cadastroCompleto`) / "Dados Profissionais" (`EditarPerfilTab`, nunca bloqueada). Aba inicial controlável via `?aba=perfil`. "Ver meu perfil" (link `/${slug}`) só aparece com slug.

**`perfil/page.tsx`** não renderiza mais UI própria — é um redirecionamento client-side para `/dashboard?aba=perfil` (preservando `?origem=` se presente). Existe só por compatibilidade com links antigos (ex: "Minha Conta" em `HeaderAuthButton`); antes duplicava UI/gatekeeping de forma inconsistente com `/dashboard`.

### `EditarPerfilTab.tsx`

Reaproveita hooks/seções do Cadastro. Promove `ativacao_status` automaticamente para `perfil_completo` quando os campos obrigatórios ficam completos e o status atual é `nao_enviado`/ausente (não sobrescreve estados vindos de outro fluxo).

**Exclusão de conta:** `handleExcluirContaTotal` própria — remove foto, deleta `prestadores`, chama `/api/delete-account`, `signOut`. Funcionalmente equivalente ao fluxo único (`/confirmar-exclusao`) mas não migrada para ele (pendência registrada em `13-roadmap.md`).

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

Card estático direcionando ao WhatsApp institucional (`lib/config/contato.ts`), com mensagem própria de prestador interessado em destaque de perfil — distinto do módulo de anúncios para lojistas (ver `11-anuncios.md`).
