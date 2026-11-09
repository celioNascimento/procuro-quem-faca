# Portfólio Público (perfil `[slug]`) — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Rota:** `app/[slug]/page.tsx` → `PerfilPublico` → `PerfilCarregado`

Duas colunas: `PerfilHero` + ações à esquerda; `PerfilSobre`, `PerfilCTA`, `PortfolioGrid`, `PerfilAvaliacoes` à direita.

**`PerfilTabs.tsx`** — alterna entre as abas Portfólio (`PortfolioGrid`) e Avaliações (`PerfilAvaliacoes`) e hospeda o `ProjetoModal`. O conteúdo das abas fica dentro de um contêiner com `min-h-[320px]`, e ambas as abas têm estado vazio visível ("Nenhum registro de atividade ainda" / "Nenhuma avaliação ainda", mesma caixa tracejada). Isso mantém a altura da página estável ao trocar de aba — nenhuma aba pode renderizar `null`, pois isso causa salto de tela.

**`usePerfilPrestador`** — duas queries: `prestadores` com joins (`cidades`, `categorias`, `portfolio_projetos`+`portfolio_fotos`+`avaliacoes.indica`) filtrado por `slug`/`id`; e `avaliacoes` separada (`visivel=true`, limite 10). Só `em_execucao`/`finalizado` aparecem publicamente; finalizados primeiro.

**`?from=`** captura a origem da busca (log `VISITA_PERFIL_VIA_BUSCA`) e é removido da URL via `history.replaceState`. É lido uma única vez por `slug` e validado como rota interna (`sanitizarRotaInterna`). Serve de **fallback** do botão voltar: com histórico do app a seta usa `history.back`; sem histórico (link direto) vai para `from` ou, sem ele, `/prestadores?q=<categoria>`. Detalhes em [18-navegacao-voltar.md](18-navegacao-voltar.md). Nome diverge de `?origem=` (dashboard) — mesma ideia, nomes diferentes.

**`PerfilHero.tsx`** — avatar, chips (categoria, projetos concluídos/em andamento, média de avaliação via `useAvaliacoes`), ações (denunciar, compartilhar via `useCompartilharPerfil`).

**`PerfilCTA.tsx`** — botão de WhatsApp (link + botão flutuante persistente via `IntersectionObserver`), usa `buildLinkWhatsapp` com mensagem de orçamento.

**`ProjetoModal.tsx`** — abre a partir de `PortfolioGrid`, usa `ModalFotoBase`, navegação via `useSlides`, comentários via `useComentariosFoto` (usa `getComentariosDaFoto` de `uploadWizard.service.ts`).

**`useCompartilharPerfil`** + `lib/services/compartilharPerfil.service.ts`: funções puras de URL/texto (`buildUrlPerfil`, `buildTextoPadrao`, `buildTextoWhatsApp`) + efeitos (`compartilharViaNative` — restrito a mobile via `pointer: coarse`, `compartilharViaWhatsApp`, `registrarCompartilhamento` via `insertLog`).

**`RastreamentoAtivacaoProvider`** — Suspense wrapper invocando `useRastreamentoAtivacao` a partir de `?src=`.
