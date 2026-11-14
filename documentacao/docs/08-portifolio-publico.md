# Portfólio Público (perfil `[slug]`) — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Rota:** `app/[slug]/page.tsx` → `PerfilPublico` → `PerfilCarregado`

Duas colunas: `PerfilHero`, `PerfilCTA` e `PerfilConfianca` à esquerda (fixa ao rolar no desktop); anúncio, `PerfilEspecialidades`, `PerfilSobre` e `PerfilTabs` (`PortfolioGrid` / `PerfilAvaliacoes`) à direita.

**Tom e leitura (14/11/2026).** Mesmo clima da lista e do cabeçalho: nome em tamanho normal (nada de itálico/maiúsculas), rótulos de seção em frase normal, botão do WhatsApp sem itálico, textos de no mínimo 12 px (antes havia 7–10 px) e botões com 44 px de toque. O `@slug` não aparece mais (era só o endereço da página).

**Avatar sem foto.** São 941 de 950 perfis. Em vez de "Sem Logo", `PerfilHero` mostra o ícone da área em fundo colorido (`lib/areaVisual.ts`, igual à lista); sem ícone conhecido, as iniciais. O ícone vem de `categorias(nome, categorias_grupos(icone))` em `usePerfilPrestador` (`grupo_icone`).

**"Sobre o profissional" (`lib/bioPerfil.ts`).** A frase pronta do cadastro automático ("Profissional qualificado disponível para atendimentos na região.", 928 perfis) não é mostrada como bio: vira "Categoria em Cidade." (só dados que o perfil já tem). Bio própria aparece como foi escrita; sem bio e sem categoria a seção some. Texto longo que começa com "Profissional qualificado" é considerado bio própria.

**Perfil montado com dados públicos (`origem_tipo = curadoria_publica`).** `AvisoPerfilPublico` mostra no topo uma faixa "Perfil montado com dados públicos de contato. É o seu? Assuma o perfil" (leva a `/reivindicar`); substituiu o cartão "Este é o seu perfil?" do fim da coluna. Some quando o perfil é reivindicado.

**Anúncio de topo** (`perfil_prestador`): faixa fina de 56 px como na lista (`AdCard` com `compacto`); anúncio com imagem própria continua em formato de faixa larga.

**Esqueleto** (`PerfilSkeleton`): segue a página (coluna do profissional, anúncio, Sobre, abas) com os mesmos recuos e larguras; mudou o layout, ajuste os dois.

**`PerfilTabs.tsx`** — alterna entre as abas Portfólio (`PortfolioGrid`) e Avaliações (`PerfilAvaliacoes`) e hospeda o `ProjetoModal`. O conteúdo das abas fica dentro de um contêiner com `min-h-[320px]`, e ambas as abas têm estado vazio visível ("Nenhum registro de atividade ainda" / "Nenhuma avaliação ainda", mesma caixa tracejada). Isso mantém a altura da página estável ao trocar de aba — nenhuma aba pode renderizar `null`, pois isso causa salto de tela.

**`usePerfilPrestador`** — duas queries: `prestadores` com joins (`cidades`, `categorias`, `portfolio_projetos`+`portfolio_fotos`+`avaliacoes.indica`) filtrado por `slug`/`id`; e `avaliacoes` separada (`visivel=true`, limite 10). Só `em_execucao`/`finalizado` aparecem publicamente; finalizados primeiro. Isso vale também no banco: as fotos de trabalhos ainda não aceitos não são legíveis por visitantes (RLS de `portfolio_fotos`, doc 03). O prestador é avisado disso na tela de novo trabalho e na lista (`lib/trabalho/visibilidade.ts`).

**`?from=`** captura a origem da busca (log `VISITA_PERFIL_VIA_BUSCA`) e é removido da URL via `history.replaceState`. É lido uma única vez por `slug` e validado como rota interna (`sanitizarRotaInterna`). Serve de **fallback** do botão voltar: com histórico do app a seta usa `history.back`; sem histórico (link direto) vai para `from` ou, sem ele, `/prestadores?q=<categoria>`. Detalhes em [18-navegacao-voltar.md](18-navegacao-voltar.md). Nome diverge de `?origem=` (dashboard) — mesma ideia, nomes diferentes.

**`PerfilHero.tsx`** — avatar, chips (categoria, projetos concluídos/em andamento, média de avaliação via `useAvaliacoes`), ações (denunciar, compartilhar via `useCompartilharPerfil`).

**`PerfilCTA.tsx`** — botão de WhatsApp (link + botão flutuante persistente via `IntersectionObserver`), usa `buildLinkWhatsapp` com mensagem de orçamento.

**`ProjetoModal.tsx`** — abre a partir de `PortfolioGrid`, usa `ModalFotoBase`, navegação via `useSlides`, comentários via `useComentariosFoto` (usa `getComentariosDaFoto` de `uploadWizard.service.ts`).

**`useCompartilharPerfil`** + `lib/services/compartilharPerfil.service.ts`: funções puras de URL/texto (`buildUrlPerfil`, `buildTextoPadrao`, `buildTextoWhatsApp`) + efeitos (`compartilharViaNative` — restrito a mobile via `pointer: coarse`, `compartilharViaWhatsApp`, `registrarCompartilhamento` via `insertLog`).

**`RastreamentoAtivacaoProvider`** — Suspense wrapper invocando `useRastreamentoAtivacao` a partir de `?src=`.
