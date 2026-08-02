# Portfólio Público (perfil `[slug]`) — PQF

Complementa `02-arquitetura.md`. Ver `14-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Rota:** `app/[slug]/page.tsx` → `PerfilPublico` → `PerfilCarregado`

Duas colunas: `PerfilHero` + ações à esquerda; `PerfilSobre`, `PerfilCTA`, `PortfolioGrid`, `PerfilAvaliacoes` à direita.

**`usePerfilPrestador`** — duas queries: `prestadores` com joins (`cidades`, `categorias`, `portfolio_projetos`+`portfolio_fotos`+`avaliacoes.indica`) filtrado por `slug`/`id`; e `avaliacoes` separada (`visivel=true`, limite 10). Só `em_execucao`/`finalizado` aparecem publicamente; finalizados primeiro.

**`?from=`** captura origem da busca (log `VISITA_PERFIL_VIA_BUSCA`), removido da URL via `history.replaceState`. Sem `?from=`, monta `/prestadores?q=<categoria>`. Nome diverge de `?origem=` (dashboard) — mesma ideia, nomes diferentes.

**`PerfilHero.tsx`** — avatar, chips (categoria, projetos concluídos/em andamento, média de avaliação via `useAvaliacoes`), ações (denunciar, compartilhar via `useCompartilharPerfil`).

**`PerfilCTA.tsx`** — botão de WhatsApp (link + botão flutuante persistente via `IntersectionObserver`), usa `buildLinkWhatsapp` com mensagem de orçamento.

**`ProjetoModal.tsx`** — abre a partir de `PortfolioGrid`, usa `ModalFotoBase`, navegação via `useSlides`, comentários via `useComentariosFoto` (usa `getComentariosDaFoto` de `uploadWizard.service.ts`).

**`useCompartilharPerfil`** + `lib/services/compartilharPerfil.service.ts`: funções puras de URL/texto (`buildUrlPerfil`, `buildTextoPadrao`, `buildTextoWhatsApp`) + efeitos (`compartilharViaNative` — restrito a mobile via `pointer: coarse`, `compartilharViaWhatsApp`, `registrarCompartilhamento` via `insertLog`).

**`RastreamentoAtivacaoProvider`** — Suspense wrapper invocando `useRastreamentoAtivacao` a partir de `?src=`.