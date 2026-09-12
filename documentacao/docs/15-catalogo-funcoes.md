# Catálogo de funções e correlações

> Inventário estático revisado em **12/09/2026**. O catálogo inclui APIs exportadas, funções internas, handlers de rota e callbacks locais com comportamento próprio. Linhas são referências aproximadas; os links de arquivo permanecem estáveis.

## Como ler este documento

- **Exportada**: pode ser importada por outro módulo.
- **Interna**: não é exportada; existe para apoiar o módulo indicado.
- **Callback/handler**: função criada para evento de UI, efeito, formulário, Realtime ou Route Handler.
- **Ativa**: localizada em um caminho importado pela aplicação.
- **Desconectada/legada**: implementada, mas sem consumidor ativo confirmado.

A correlação deve ser lida junto com [`02-arquitetura.md`](./02-arquitetura.md), que explica as camadas, e [`00-glossario.md`](./00-glossario.md), que organiza os conceitos de negócio.

## Fluxos ponta a ponta

| Fluxo | Entrada | Orquestração | Persistência/saída |
|---|---|---|---|
| Login | [`app/login/page.tsx`](../../app/login/page.tsx) | [`useLoginForm`](../../hooks/useLoginForm.ts) → [`resolverDestinoPosLogin`](../../lib/auth/resolverDestinoPosLogin.ts) | [`auth.service`](../../lib/services/auth.service.ts), Supabase Auth |
| Cadastro de prestador | [`app/cadastro/page.tsx`](../../app/cadastro/page.tsx) | [`useCadastroPrestador`](../../hooks/useCadastroPrestador.ts) → [`cadastroPrestador.service`](../../lib/services/cadastroPrestador.service.ts) | `profiles`, `prestadores`, Storage |
| Busca | [`app/prestadores/page.tsx`](../../app/prestadores/page.tsx) | [`usePrestadores`](../../hooks/usePrestadores.ts), [`useFiltrosPrestadores`](../../hooks/useFiltrosPrestadores.ts) | [`prestador.service`/queries](../../lib), cards e anúncios |
| Perfil público | [`app/(perfil)/[slug]/page.tsx`](../../app/(perfil)/[slug]/page.tsx) | [`usePerfilPrestador`](../../hooks/usePerfilPrestador.ts) → [`PerfilPublicoClient`](../../app/(perfil)/[slug]/PerfilPublicoClient.tsx) | Perfil, portfólio, avaliações e URL `?projeto=` |
| Portfólio | [`UploadWizardContainer`](../../components/dashboard/wizard/UploadWizardContainer.tsx) | [`useUploadWizard`](../../hooks/useUploadWizard.ts) → [`uploadWizard.service`](../../lib/services/uploadWizard.service.ts) | `portfolio_projetos`, `portfolio_fotos`, Storage |
| Acompanhamento | [`app/acompanhamento/[token]/page.tsx`](../../app/acompanhamento/[token]/page.tsx) | [`useAcompanhamento`](../../hooks/useAcompanhamento.ts) | Token, projeto, garantia e avaliação |
| Avaliação | [`app/avaliar/[token]/page.tsx`](../../app/avaliar/[token]/page.tsx) | [`useAvaliar`](../../hooks/useAvaliacao.ts) → [`avaliacao.service`](../../lib/services/avaliacao.service.ts) | `avaliacoes`, comentários e evidências |
| Administração | [`middleware.ts`](../../middleware.ts) → `app/(admin)/` | hooks admin → services admin | `perfis_admin`, logs e entidades administrativas |

## Rotas e handlers

As páginas exportam o componente default descrito abaixo. Handlers `GET`/`POST` ficam no mesmo arquivo de rota.

| Rota/arquivo | Funções e objetivo |
|---|---|
| [`app/page.tsx`](../../app/page.tsx) | `Home` (entrada); `dispararBusca` (submete termo e navega). |
| [`app/prestadores/page.tsx`](../../app/prestadores/page.tsx) | `PaginaPrestadores`; `resolver`/`calcular` carregam e posicionam prestadores/anúncios; `shuffleArray`, `criarSorteador`, `chavePracaDe`, `calcularPosicoesComAnuncio` e `AdCardEntreCards` sustentam a ordenação e inserção de publicidade. |
| [`app/(perfil)/[slug]/page.tsx`](../../app/(perfil)/[slug]/page.tsx) | `buscarPerfil` carrega dados SEO; `normalizarDescricao` higieniza bio; `criarTitulo` gera metadados; `PerfilPublicoPage` renderiza a página. |
| [`app/(perfil)/[slug]/PerfilPublicoClient.tsx`](../../app/(perfil)/[slug]/PerfilPublicoClient.tsx) | `PerfilPublicoClient` e `PerfilCarregado`; `carregarAnuncio` busca anúncio contextual. |
| [`app/cadastro/page.tsx`](../../app/cadastro/page.tsx) | `CadastroPage`, `FormularioCadastro`, `CadastroSkeleton`: carregamento e formulário de onboarding. |
| [`app/login/page.tsx`](../../app/login/page.tsx) | `Login`: tela de entrada; lógica principal está em `useLoginForm`. |
| [`app/acompanhamento/[token]/page.tsx`](../../app/acompanhamento/[token]/page.tsx) | `PaginaAcompanhamento`: tela pública protegida por token. |
| [`app/avaliar/[token]/page.tsx`](../../app/avaliar/[token]/page.tsx) | `PaginaAvaliar`: entrada do formulário de avaliação por token. |
| [`app/meus-servicos/page.tsx`](../../app/meus-servicos/page.tsx) | `MeusServicosPage`: painel de serviços do cliente. |
| [`app/painel/perfil/page.tsx`](../../app/painel/perfil/page.tsx) | `PerfilDoCliente`: edição do perfil do cliente. |
| [`app/(dashboard)/dashboard/page.tsx`](../../app/(dashboard)/dashboard/page.tsx) | `PerfilPage`, `PerfilPageContent`: dashboard do prestador. |
| [`app/(dashboard)/dashboard/perfil/page.tsx`](../../app/(dashboard)/dashboard/perfil/page.tsx) | `PerfilPage`, `RedirecionarParaDashboard`: compatibilidade/redirect. |
| [`app/denunciar/[id]/page.tsx`](../../app/denunciar/[id]/page.tsx) | `PaginaDenuncia`, `enviarDenuncia`: submissão de denúncia. |
| [`app/confirmar-exclusao/page.tsx`](../../app/confirmar-exclusao/page.tsx) | `ConfirmarExclusao`: confirmação do fluxo de remoção de conta. |
| [`app/auth/callback/route.ts`](../../app/auth/callback/route.ts) | Callback OAuth; troca o código e resolve destino pós-login. |
| [`app/api/delete-account/route.ts`](../../app/api/delete-account/route.ts) | Route Handler de exclusão via cliente administrativo. |
| [`app/api/garantia/responder/route.ts`](../../app/api/garantia/responder/route.ts) | Handler de resposta de garantia; `calcularPrazoUteis` calcula prazo de dias úteis. |
| [`app/api/garantia/promover-fotos/route.ts`](../../app/api/garantia/promover-fotos/route.ts) | Promove evidências para portfólio; `extrairPathDoBucket` converte URL pública em path de Storage. |
| [`app/api/anuncios/metricas/route.ts`](../../app/api/anuncios/metricas/route.ts) | Recebe métricas; `createServiceClient` cria cliente privilegiado controlado. |
| [`app/api/admin/prestadores/route.ts`](../../app/api/admin/prestadores/route.ts) | API administrativa de prestadores. |
| [`app/api/admin/anunciantes/route.ts`](../../app/api/admin/anunciantes/route.ts) | API de anunciantes; `gerarSenhaTemporaria` cria credencial inicial. |
| [`app/(admin)/admin/**`](../../app/(admin)/admin) | Páginas `AdminDashboard`, `LoginPage`, `AdminLogs`, `ModeracaoPage`, `PovoarApp`, `GestaoHabilidades`, `SuperGestaoGeografia`, `PrestadoresPage`, `PainelAnunciosLojista` e handlers locais de formulário. |
| [`app/layout.tsx`](../../app/layout.tsx) | `RootLayout`; providers, metadata, analytics e estrutura global. |

## Hooks exportados

Todos os hooks abaixo são pontos de entrada de UI. O hook geralmente mantém estado/efeitos e delega I/O para `lib/services` ou `lib/db`.

| Domínio | Hooks |
|---|---|
| Auth/sessão | [`useAuth`](../../hooks/useAuth.ts), [`useSession`](../../hooks/useSession.ts), [`useLoginForm`](../../hooks/useLoginForm.ts), [`useLogout`](../../hooks/useLogout.ts), [`useGoogleAuth`](../../hooks/useGoogleAuth.ts), [`useNovaSenha`](../../hooks/useNovaSenha.ts), [`useConfirmarExclusaoConta`](../../hooks/useConfirmarExclusaoConta.ts) |
| Prestador/perfil | [`useCadastroPrestador`](../../hooks/useCadastroPrestador.ts), [`usePrestadorForm`](../../hooks/usePrestadorForm.ts), [`usePerfilPrestador`](../../hooks/usePerfilPrestador.ts), [`usePerfilStatus`](../../hooks/usePerfilStatus.ts), [`usePerfilUI`](../../hooks/usePerfilUI.ts), [`usePerfilDados`](../../hooks/usePerfilDados.ts), [`useEditarPerfilPrestador`](../../hooks/useEditarPerfilPrestador.ts), [`useSlugCheck`](../../hooks/useSlugCheck.ts), [`usePrestadores`](../../hooks/usePrestadores.ts) |
| Cliente | [`usePerfilCliente`](../../hooks/usePerfilCliente.ts), [`usePerfilDados`](../../hooks/usePerfilDados.ts), [`usePainelCliente`](../../hooks/usePainelCliente.ts), [`useServicosCliente`](../../hooks/useServicosCliente.ts), [`useHeaderCliente`](../../hooks/useHeaderCliente.ts) |
| Portfólio/garantia | [`useUploadWizard`](../../hooks/useUploadWizard.ts), [`usePortfolioDashboard`](../../hooks/usePortfolioDashboard.ts), [`useGarantiaWizard`](../../hooks/useGarantiaWizard.ts), [`useCasoGarantiaDoProjeto`](../../hooks/useCasoGarantiaDoProjeto.ts), [`useComentariosFoto`](../../hooks/useComentariosFoto.ts), [`useAcompanhamento`](../../hooks/useAcompanhamento.ts) |
| Avaliações | [`useAvaliar`](../../hooks/useAvaliacao.ts), [`useAvaliacoes`](../../hooks/useAvaliacoes.ts), [`useSubmitAvaliacao`](../../hooks/useSubmitAvaliacao.ts), [`useAvaliacaoDoProjeto`](../../hooks/useAvaliacaoDoProjeto.ts), [`useAvaliacaoClienteDoProjeto`](../../hooks/useAvaliacaoClienteDoProjeto.ts), [`useAvaliacoesRecebidasCliente`](../../hooks/useAvaliacoesRecebidasCliente.ts) |
| Busca/UX | [`useFiltrosPrestadores`](../../hooks/useFiltrosPrestadores.ts), [`useFiltrosParams`](../../hooks/useFiltrosParams.ts), [`useSugestoes`](../../hooks/useSugestoes.ts), [`useSlides`](../../hooks/useSlides.ts), [`useCompartilharPerfil`](../../hooks/useCompartilharPerfil.ts), [`useLocalizacao`](../../hooks/useLocalizacao.ts), [`useCategorias`](../../hooks/useCategorias.ts), [`useCookieConsent`](../../hooks/useCookieConsent.ts), [`useHaptic`](../../hooks/useHaptic.ts) |
| Anúncios/ativação | [`useAdContext`](../../hooks/useAdContext.ts), [`useAdminAnuncios`](../../hooks/useAdminAnuncios.ts), [`useRastreamentoAtivacao`](../../hooks/useRastreamentoAtivacao.ts), [`useSegmentacaoReferencia`](../../hooks/useSegmentacaoReferencia.ts) |
| Admin | [`useAdminAuth`](../../hooks/useAdminAuth.ts), [`useAdminDashboard`](../../hooks/useAdminDashboard.ts), [`useAdminLogs`](../../hooks/useAdminLogs.ts), [`useModeracao`](../../hooks/useModeracao.ts), [`useHabilidades`](../../hooks/useHabilidades.ts), [`usePovoar`](../../hooks/usePovoar.ts), [`useAdminPrestadores`](../../hooks/admin/useAdminPrestadores.ts), [`useGeografia`](../../app/(admin)/admin/geografia/hooks/useGeografia.ts) |

### Funções internas e callbacks relevantes dos hooks

- `useAuth`: `getCachedSession`, `getCachedAuthState`, `loginGoogle` — cache local de sessão, hidratação e login OAuth.
- `useLoginForm`: `getAuthRedirectUrl`, `handleEsqueciSenha`, `handleLogin` — destino, recuperação e submissão.
- `usePerfilPrestador`: `normalizarArray`, `carregar` — normaliza relações Supabase e carrega perfil.
- `usePerfilDados`: `processarUsuario` — transforma sessão em dados de perfil.
- `usePrestadores`: `calcularMedias`, `normalizarCidade`, `normalizarId`, `parsearBusca`, `fetchDados` — normalização, parsing e busca.
- `useServicosCliente`: `estaProntoParaAvaliar`, `buscar` — regra de disponibilidade de avaliação e carregamento.
- `useAvaliacao`/`useAcompanhamento`: `carregar` — leitura dos fluxos públicos por token.
- `useSubmitAvaliacao`: `submit` — valida e envia avaliação.
- `useNovaSenha`: `handleSubmit` — atualiza senha e finaliza sessão.
- `useCookieConsent`: `verificar`, `aceitar` — persiste e lê consentimento.
- `useFiltrosPrestadores`: `aplicar`, `limparFiltros` — altera estado dos filtros.
- `usePovoar`: `aplicarMascaraFone`, `gerarSlug` — prepara dados administrativos.
- `useHabilidades`: `toSlug`, `getSaveError` — slug e mensagens de erro.
- `useGeografia`: `addEstado`, `addRegiao`, `addCidade`, `atualizarRegiaoCidade` — mutations da administração geográfica.

## Services, DB e utilitários

| Arquivo | Funções/objetivo |
|---|---|
| [`lib/services/auth.service.ts`](../../lib/services/auth.service.ts) | Autenticação, role inicial e logout legado. Consumido por hooks de auth. |
| [`lib/services/cadastroPrestador.service.ts`](../../lib/services/cadastroPrestador.service.ts) | CRUD/onboarding, slug, busca por usuário e dados do prestador. |
| [`lib/services/cliente.service.ts`](../../lib/services/cliente.service.ts) | Perfil/avatar e exclusão de conta; `temGarantiaAtiva` aplica filtro de negócio. |
| [`lib/services/avaliacao.service.ts`](../../lib/services/avaliacao.service.ts) | Busca por token/projeto, criação de avaliação e comentários. |
| [`lib/services/uploadWizard.service.ts`](../../lib/services/uploadWizard.service.ts) | Projetos, fotos, legendas e upload do portfólio. |
| [`lib/services/portfolioDashboard.service.ts`](../../lib/services/portfolioDashboard.service.ts) | Reexporta operações usadas pelo dashboard de portfólio. |
| [`lib/services/garantia.service.ts`](../../lib/services/garantia.service.ts) | Casos de garantia; `calcularPrazoUteis` exclui fins de semana. |
| [`lib/services/painelCliente.service.ts`](../../lib/services/painelCliente.service.ts) | Serviços do cliente; `temGarantiaAtiva`, `temReclamacaoAtiva`, `filtrarComGarantiaAtiva`, `filtrarComReclamacaoAtiva`. |
| [`lib/services/localizacao.service.ts`](../../lib/services/localizacao.service.ts) | Estados, regiões, cidades e vitrine por cidade. |
| [`lib/services/categorias.service.ts`](../../lib/services/categorias.service.ts) | Grupos, categorias e habilidades. |
| [`lib/services/denuncia.service.ts`](../../lib/services/denuncia.service.ts) | Criação, leitura e moderação de denúncias. |
| [`lib/services/exclusaoConta.service.ts`](../../lib/services/exclusaoConta.service.ts) | Remoção de fotos e prestador antes da exclusão do usuário. |
| [`lib/services/compartilharPerfil.service.ts`](../../lib/services/compartilharPerfil.service.ts) | `buildUrlPerfil`, `buildTextoPadrao`, `buildTextoWhatsApp`, `compartilharViaWhatsApp`; compartilhamento sem token privado. |
| [`lib/services/admin*.service.ts`](../../lib/services) | Dashboard, auth, logs, anúncios e prestadores administrativos; `periodosSeSobrepoe`, `contarAnunciosSobrepostosNaPraca`, `contarPrestadoresDaPraca` apoiam inventário de anúncios. |
| [`lib/db/logs.ts`](../../lib/db/logs.ts) | `insertLog`, `checkLogExists`, `subscribeLogsAtividades`: auditoria e Realtime. |
| [`lib/db/geografia.ts`](../../lib/db/geografia.ts) | Queries/mutations de estados, regiões e cidades. |
| [`lib/db/categorias.ts`](../../lib/db/categorias.ts) | `getSugestoesDestaque`, `getSugestoesPorBusca`: autocomplete. |
| [`lib/supabase/client.ts`](../../lib/supabase/client.ts) | `createClient`, `createPublicClient`, instância `supabase`. |
| [`lib/supabase/server.ts`](../../lib/supabase/server.ts) | `createClient`: cliente server-side com cookies. |
| [`lib/supabase/admin.ts`](../../lib/supabase/admin.ts) | `getAdminClient`: service role; somente servidor/API. |
| [`lib/uploadFoto.ts`](../../lib/uploadFoto.ts) | `fazerUploadFoto`, `removerFotoAntiga`; `extrairPathDoBucket` é helper interno. |
| [`lib/uploadEvidencias.ts`](../../lib/uploadEvidencias.ts) | `uploadEvidencias`, `removerEvidencias`; `uploadUmArquivo` e `extrairPathDoBucket` são internos. |
| [`lib/utils/whatsapp.ts`](../../lib/utils/whatsapp.ts) | `limparNumero`, `buildLinkWhatsapp`: links `wa.me` com prefixo brasileiro. |
| [`lib/utils/avaliacao.utils.ts`](../../lib/utils/avaliacao.utils.ts) | `normalizar`, `calcularStats`; `notaParaCalculo` é helper interno e aplica nota segura. |
| [`lib/prestadorUtils.ts`](../../lib/prestadorUtils.ts) | `getIniciais`, `getLocalizacao`, `getPerfilHref`, `getTituloBusca`: apresentação e links. |
| [`lib/mascaras.ts`](../../lib/mascaras.ts) | `aplicarMascaraWhatsapp`, `formatarParaSlug`. |
| [`lib/ordenacao.ts`](../../lib/ordenacao.ts) | `pesoOrdenacao`: prioridade de prestadores. |
| [`lib/buscaUtils.tsx`](../../lib/buscaUtils.tsx) | `normalizarTermo`, `filtrarPrestadores`; `simplificar` é interno. |
| [`lib/auth/resolverDestinoPosLogin.ts`](../../lib/auth/resolverDestinoPosLogin.ts) | `isPrestadorCompleto`, `resolverDestinoPosLogin`: única decisão de redirecionamento. |
| [`lib/ads/*.ts`](../../lib/ads) | `resolverSegmento`, `getFallbackPorSegmento`: segmentação e fallback de anúncios. |
| [`lib/cookies.ts`](../../lib/cookies.ts) | `setCookie`, `getCookie`: cookies simples, usado pela localização/UX. |
| [`lib/contexts/LocationContext.tsx`](../../lib/contexts/LocationContext.tsx) | `LocationProvider`, `useLocation`; módulo pronto, porém não montado no layout raiz. |
| [`lib/db/visitasPerfil.ts`](../../lib/db/visitasPerfil.ts) | registro/consulta de visita; `cookieKeyVisita` é helper interno. |

## Componentes e callbacks locais

Componentes de apresentação são catalogados pelo arquivo; callbacks locais devem ser entendidos como parte do componente que os declara. Os agrupamentos abaixo são os consumidores principais dos hooks/services.

- **Auth**: [`components/auth`](../../components/auth), [`components/HeaderAuthButton.tsx`](../../components/HeaderAuthButton.tsx). Formulários de login/cadastro, senha, OAuth e logout.
- **Home/busca**: [`components/home`](../../components/home), [`components/filtros`](../../components/filtros), [`components/cards/PrestadorCard.tsx`](../../components/cards/PrestadorCard.tsx). Callbacks de submit, filtros, seleção e navegação.
- **Dashboard**: [`components/dashboard`](../../components/dashboard). Tabs, edição, anúncios, avaliações e wizard.
- **Wizard/garantia**: [`components/dashboard/wizard`](../../components/dashboard/wizard). Callbacks de upload, legenda, zoom, comentários e status.
- **Perfil público**: [`components/profile`](../../components/profile). `PortfolioGrid` usa a URL `?projeto=`; `ProjetoModal`, avaliações e CTA consomem o projeto selecionado.
- **Cliente/acompanhamento**: [`components/meus-servicos`](../../components/meus-servicos), [`components/acompanhamento`](../../components/acompanhamento), [`components/painel`](../../components/painel). Ações de aceite, contato, garantia e avaliação.
- **Admin**: [`components/admin`](../../components/admin), [`app/(admin)/admin/geografia/components`](../../app/(admin)/admin/geografia/components). Callbacks de CRUD, filtros, modais, cópia e mudança de status.
- **Transversais**: [`components/PostHogProvider.tsx`](../../components/PostHogProvider.tsx), [`components/PostHogPageview.tsx`](../../components/PostHogPageview.tsx), [`components/LogAcesso.tsx`](../../components/LogAcesso.tsx), [`components/CookieConsent.tsx`](../../components/CookieConsent.tsx), [`components/RastreamentoAtivacaoProvider.tsx`](../../components/RastreamentoAtivacaoProvider.tsx). Analytics, consentimento e auditoria.

## Tipos e contratos

Os contratos compartilhados estão em [`types/`](../../types). Os principais são `Prestador`, `PrestadorFormData`, `PerfilData`, `ProjetoPerfil`, `Avaliacao`, `AvaliacaoPerfil`, `ClienteServico`, `Anuncio`, `Segmentacao`, `Estado`, `Regiao` e `Cidade`. [`types/adminPrestadores.ts`](../../types/adminPrestadores.ts) também contém funções de normalização (`getPrestadorStage`, `getEtapaLabel`, `getCompletude`, `getProximaAcao`, `normalizeAdminPrestador`, `matchesTab`, `formatOrigem`, `formatDate`, `getMensagem`, `buildEmail`) usadas pela central administrativa.

## Itens não conectados ou com atenção especial

- `LocationProvider`/`LocationModal`: implementados, mas não envolvidos no layout raiz.
- Componentes novos do wizard e conjunto de avaliações em `components/profile`: existem, mas alguns não têm consumidor confirmado.
- `lib/db/acessos.ts`: não tratar como dependência ativa sem confirmação do schema.
- `app/(admin)/admin/ativacao/page.js`: variante JavaScript legada/independente; comparar antes de alterar o fluxo TSX.
- Anúncios possuem infraestrutura e painel, mas partes de medição/contratação ainda não estão confirmadas no frontend.

## Manutenção do catálogo

Ao adicionar uma função com comportamento próprio, atualize: (1) o documento de domínio correspondente, (2) esta tabela ou o agrupamento pertinente, (3) o fluxo ponta a ponta se a função alterar uma correlação. Use links relativos para o arquivo e marque explicitamente `Desconectada` quando não houver consumidor. Não documente apenas o nome: registre entradas, saída, efeito colateral e quem chama.

### Verificação recomendada

```bash
npm run lint
npm run test:run
npm run build
```

A varredura foi feita por busca de exports, funções internas, handlers e imports em `app`, `components`, `hooks`, `lib`, `config` e `types`; o catálogo é uma visão arquitetural e não substitui os contratos TypeScript nem as migrations do Supabase.

[Voltar ao índice](../README.md)

## Referências cruzadas

- [Arquitetura](./02-arquitetura.md)
- [Banco de dados](./03-banco-de-dados.md)
- [Autenticação](./04-autenticacao.md)
- [Admin](./12-admin.md)
- [Roadmap](./13-roadmap.md)

## Como atualizar

Após alterar um fluxo, procure o símbolo no catálogo, valide seus consumidores com busca de imports/chamadas e atualize primeiro o documento de domínio, depois o catálogo central. Links de código devem ser relativos à raiz do repositório.

---

Última revisão: 12 de setembro de 2026.

> Referência no código: comentários pontuais podem apontar para esta página usando `documentacao/docs/15-catalogo-funcoes.md#<secao>` quando a relação não for óbvia.
