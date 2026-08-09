# Glossário — PQF

Índice por **conceito**, não por arquivo. Cada entrada lista todos os pontos do código que tocam aquele conceito, para que uma mudança de comportamento (ex: "como o avatar é exibido") possa ser localizada e aplicada de forma consistente em todos os lugares relevantes de uma vez, em vez de descobrir aos poucos que existem 3 implementações divergentes.

---

## Avatar / Foto de perfil

Existem **contextos distintos** de avatar, cada um com sua própria fonte de dados e componente de exibição. Não há hoje um componente único de "avatar" reaproveitado — se for unificar visualmente, estes são todos os pontos a tocar:

| Contexto | Componente de exibição | Dado/campo | Upload |
|---|---|---|---|
| Prestador — form de cadastro/edição | `components/perfil/FotoUpload.tsx` (variants `cadastro`/`dashboard`) | `prestadores.foto_perfil` | `lib/uploadFoto.ts` → `fazerUploadFoto` |
| Prestador — card em listagem | `components/cards/PrestadorCard.tsx` (com fallback de iniciais via `getIniciais`) | `prestador.foto_perfil` | — (somente leitura) |
| Prestador — sidebar do dashboard | `components/dashboard/PrestadorSideCard.tsx` | `foto_perfil` (prop) | — |
| Prestador — perfil público (hero) | `components/profile/PerfilHero.tsx` | `prestador.foto_perfil` | — |
| Cliente — card de perfil | `components/perfil/CardPerfilCliente.tsx` (upload clicável direto no avatar) | `profiles.avatar_url` | `ClienteService.uploadClienteAvatar` (`lib/services/cliente.service.ts`) |
| Cliente — header | `components/perfil/HeaderCliente.tsx` | — (só nome, não exibe avatar) | — |
| Avatar do Google (fallback) | Usado em `usePerfilDados` e `useCadastroPrestador` | `user_metadata.picture`/`avatar_url` da sessão OAuth | Salvo automaticamente se ainda não houver avatar próprio |

**Padrão de fallback de imagem quebrada:** `onError` trocando `src` (visto em `PrestadorCard`, `PortfolioGrid`) ou fallback de iniciais (`getIniciais` em `lib/prestadorUtils.ts`). Não há um componente `<Avatar>` genérico — cada consumidor implementa o próprio placeholder.

**Se for unificar:** o candidato natural a extrair seria um componente `<Avatar src={} nome={} tamanho={} />` compartilhado em `components/shared/`, usado pelos 6 pontos acima. Ainda não existe.

---

## Contato via WhatsApp

**Util centralizado:** `lib/utils/whatsapp.ts`
```typescript
limparNumero(whatsapp?: string | null): string
buildLinkWhatsapp(whatsapp?: string | null, mensagem?: string): string | undefined
```
Monta `https://wa.me/55<numero>` (prefixo Brasil fixo), com mensagem opcional pré-preenchida via `?text=`.

**Consumidores atuais:**
- `components/acompanhamento/CardPrestador.tsx`
- `components/meus-servicos/ServicoCard.tsx`
- `components/profile/PerfilCTA.tsx` (perfil público, com mensagem de orçamento)

**Consumidores que montam o link manualmente, sem usar o util** (candidatos a migrar, se for auditar todos de uma vez):
- `hooks/useUploadWizard.ts` — `gerarLinkAceite`/`gerarLinkConclusao` montam `https://wa.me/55${numTelefone}?text=...` diretamente
- `lib/services/compartilharPerfil.service.ts` — `compartilharViaWhatsApp` monta o link manualmente
- `lib/ads/fallbacks.ts` e `components/dashboard/AnunciosTab.tsx` — usam `lib/config/contato.ts` (`NUMERO_WHATSAPP_PQF`), propósito diferente (contato institucional, não com um prestador/cliente específico)

**Número institucional do PQF** (canal comercial, distinto de qualquer prestador/cliente): `lib/config/contato.ts` → `NUMERO_WHATSAPP_PQF`.

---

## Refatoração de UI/UX: Componente de Acompanhamento (CardPrestador)

*   **Problema Relatado:** O card de prestador na página de acompanhamento (`/acompanhamento/[token]`) apresentava uma estética destoante do restante do site (banner grande, uso excessivo de gradientes), ocupava espaço excessivo na tela (impedindo a visualização da linha do tempo no mobile) e apresentava redundância nas ações de contato.
*   **Solução Arquitetural:**
    1.  **Compactação Visual:** O componente foi convertido de um card vertical "Hero" para um layout horizontal compacto, alinhando-se à identidade visual minimalista do restante do ecossistema.
    2.  **Ganho de Área Útil:** A redução da altura do componente devolveu espaço vertical significativo (aprox. 250px) para a visualização do conteúdo principal (linha do tempo).
    3.  **Padronização:** Adoção de paleta de cores consistente (`slate-100`, bordas sutis, avatares arredondados) e simplificação dos botões de ação (WhatsApp e Compartilhamento agrupados), removendo ruído estético e redundância de interface.
       
## Logout

**Mecanismo centralizado:** `useLogout().logout(opts?)` (`hooks/useLogout.ts`).

Todo o fluxo de logout de interface (tanto para prestadores quanto para clientes) foi unificado neste hook. Ele garante:
- Registro de log de auditoria (`LOGOUT_USUARIO`)
- Limpeza rigorosa de cache (`pqf_session_cache`, `pqf_auth_state` e `sessionStorage`)
- Encerramento da sessão no Supabase
- Redirecionamento configurável via parâmetro `{ origem?, redirectTo? }`

**Consumidores atuais:**
- `HeaderAuthButton.tsx` (Header global)
- `useHeaderCliente.ts` (Painel do cliente, força redirecionamento para `/`)
- `useNovaSenha.ts` (Pós-recuperação)

**Exceção técnica intencional:** 
`useConfirmarExclusaoConta.ts` faz uma chamada direta a `supabase.auth.signOut()` apenas como última etapa do fluxo de destruição da conta.

*Nota técnica:* A função legada `logoutCliente()` em `lib/services/auth.service.ts` foi descontinuada do roteamento de UI.


## Comportamento do Header e Menus Flutuantes (Dropdowns)

* **Problema Relatado:** O menu suspenso de autenticação (perfil, painel e botão de logout) não respondia ao toque ou aparecia invisível em páginas públicas do ecossistema.
* **Causa Raiz:** A presença da classe utilitária `overflow-hidden` na tag `<nav>` principal do componente `Header.tsx` agia como uma restrição de layout, cortando qualquer elemento posicionado de forma absoluta (como o menu dropdown flutuante) que ultrapassasse os limites da barra de navegação.
* **Solução Arquitetural:** 
  1. **Liberação de Overflow:** Remoção de `overflow-hidden` do container principal em `Header.tsx` para permitir a renderização correta de elementos flutuantes.
  2. **Logout com Forçamento de Recarregamento:** O hook `useLogout.ts` foi blindado com checagem de rota e fallback para `window.location.reload()` / `window.location.href = '/'`, garantindo que a sessão seja encerrada e o cache visual seja limpo imediatamente em qualquer página do site.
     
---

## Log de atividades

**Fonte única:** `lib/db/logs.ts` → `insertLog(payload)`, `checkLogExists(usuarioId, acao)`. Tabela `logs_atividades` (schema: `acao`, `entidade_tipo`, `entidade_id`, `detalhes`, `usuario_id`, `usuario_email`).

Todo registro de evento no sistema passa por aqui — não existe mais nenhuma tabela paralela de log de eventos de produto (`logs_eventos` foi descontinuada em favor desta).

**Distinto de:** `lib/db/acessos.ts` → `insertAcesso`, tabela `acessos` — registra visita/sessão de navegador (um por sessão), não eventos de negócio. Usado só por `components/LogAcesso.tsx` (montado uma vez no layout raiz).

---

## Exclusão de conta

**Fluxo único:** `app/confirmar-exclusao/page.tsx` + `hooks/useConfirmarExclusaoConta.ts`, para cliente e prestador.

- Decide o caminho via `useAuth().role`
- Prestador: `lib/services/exclusaoConta.service.ts` (`removerFotoPrestador`, `deletarPrestadorPorUserId`) + `buscarPrestadorPorUserId` (de `cadastroPrestador.service.ts`)
- Cliente: `ClienteService.fetchClienteProfile` + `ClienteService.deleteClienteAccount` (`lib/services/cliente.service.ts`)
- Ambos: `insertLog('EXCLUSAO_CONTA_VOLUNTARIA')` → `POST /api/delete-account` (remove de `auth.users` via service role) → `signOut()`

**Exceção não migrada:** `components/dashboard/EditarPerfilTab.tsx` tem seu próprio `handleExcluirContaTotal`, funcionalmente equivalente mas implementado de forma independente — não redireciona para `/confirmar-exclusao`.

---

## Status de projeto (`portfolio_projetos.status`)

**Valores reais:** `em_registro` → `pendente` → `em_execucao` → `finalizado`. `'concluido'` **não existe** como valor de banco — é só um nome de estado de filtro de UI em alguns lugares (ex: `Filtro` type em `PainelDoCliente.tsx`), nunca deve ser comparado contra `servico.status`.

**Pontos que derivam rótulo/cor visual a partir do status** (cada um implementa a própria derivação — não há uma função utilitária compartilhada):
- `components/dashboard/ProjetoCard.tsx` → `getStatusConfig`
- `components/dashboard/wizard/UploadWizardContainer.tsx` e `WizardForm.tsx` → badge inline
- `components/acompanhamento/LinhaDeTempo.tsx` → badge inline
- `components/acompanhamento/CardPrestador.tsx` → `statusLabel` inline
- `components/meus-servicos/ServicoCard.tsx` → prop `modo` (`pendente`/`andamento`/`concluido` — nomenclatura de UI, mapeada a partir do status real por quem chama)
- `hooks/useServicosCliente.ts` → `getStatusInfo`, `getRotaDestino`

Se for centralizar essa derivação, esses 6 pontos são os candidatos a convergir para uma função única (ex: `lib/utils/statusProjeto.ts`).

---

## Compartilhamento Seguro e Deep Linking de Projetos

* **Problema Relatado:** O botão de compartilhar dentro da área de acompanhamento do cliente utilizava a URL ativa (contendo o `token` de acesso privado). Isso expunha dados sensíveis e logs da obra para visitantes não autorizados. Além disso, o clique em avaliações no perfil público não abria o modal do projeto correspondente, e fechar e reabrir o modal travava a interface.

* **Solução Arquitetural (Implementada):**
  1. **Desacoplamento de Acesso:** O `handleShare` (no hook `useAcompanhamento.ts`) foi refatorado para nunca compartilhar o token. A URL gerada passa a apontar exclusivamente para a vitrine pública do prestador (`/[slug]`).
  2. **Inclusão de Slug na Busca:** Atualização na query `fetchProjetoPorToken` (em `avaliacao.service.ts`) para incluir o campo `slug` de `prestadores`, garantindo a construção correta da URL pública.
  3. **Deep Linking (UX):** A URL de compartilhamento recebe o query parameter `?projeto=[ID]`. O componente `PortfolioGrid.tsx` intercepta este parâmetro usando `useSearchParams` e abre automaticamente o `ProjetoModal` correspondente. O mesmo mecanismo é usado pelo clique em avaliações em `PerfilAvaliacoes.tsx` — ambos fazem `router.push('?projeto=<id>')` e o `PortfolioGrid` resolve.
  4. **URL como fonte única de verdade (modal):** `PortfolioGrid.tsx` não usa mais `useState`/`useEffect` para controlar o modal. O projeto aberto é derivado diretamente de `searchParams.get('projeto')`, e fechar o modal faz `router.push(pathname)` limpando o parâmetro. Isso elimina a dessincronização entre estado local e URL que causava travamento ao fechar e reabrir.
  5. **Avaliações com `comentario` no modal:** A query de `portfolio_projetos` em `usePerfilPrestador` não inclui mais o join `avaliacoes(id, indica)` — sujeito a RLS e sem `comentario`. As avaliações de cada projeto são cruzadas no frontend a partir da query pública separada (`avaliacoesRaw`), filtrando por `projeto_id`. Isso garante que `comentario` e `indica` estejam disponíveis no `ProjetoModal`.

* **Arquivos envolvidos:**
  - `hooks/usePerfilPrestador.ts` — query sem join de avaliações; cruzamento por `projeto_id` no map dos projetos
  - `components/profile/PortfolioGrid.tsx` — controle do modal 100% via URL, sem `useState`
  - `components/profile/PerfilAvaliacoes.tsx` — `router.push('?projeto=<id>')` ao clicar no rodapé do card
  - `types/perfil.ts` — `ProjetoPerfil.avaliacoes` inclui `comentario?: string | null`
  - `types/avaliacao.ts` — `AvaliacaoPerfil` inclui `projeto_id` e `portfolio_projetos`

* **Regra de ouro:** qualquer novo ponto de entrada que queira abrir um projeto no perfil público deve apenas fazer `router.push('?projeto=<id>')` — o `PortfolioGrid` já cuida do resto.

---

## Localização (estados / regiões / cidades)

**Service central:** `lib/services/localizacao.service.ts` — `fetchEstados`, `fetchRegioesPorEstado`, `fetchCidadesPorRegiaoOuEstado`, `getCidadesAtivasParaFiltro`, `getPrestadoresVitrinePorCidade`.

**Consumido por:** `hooks/useLocalizacao.ts` (cascata estado→região→cidade, usado no Cadastro/Edição de Prestador).

**Módulo separado e não conectado:** `lib/contexts/LocationContext.tsx` + `components/location/LocationModal.tsx` — modal de seleção obrigatória de cidade via cookie (`pqf_cidade`), desenhado para bloquear navegação até o usuário escolher uma cidade. Nunca foi plugado no layout (`LocationProvider` não envolve a árvore em `app/layout.tsx`). Decisão: manter não conectado por ora — a busca por texto livre (`"pedreiro em Londrina"`, resolvida em `usePrestadores`) já cobre a necessidade no estágio atual do produto.

**Geolocalização silenciosa** (distinta do modal acima): `hooks/usePrestadores.ts`, via Nominatim/OpenStreetMap, só roda se não houver `?cidade=` na URL.

---

## Anúncios

**Dois sistemas de anúncio, propósitos diferentes:**

1. **Anúncio para lojistas/fornecedores** (ex: loja de material de construção anunciando na busca) — `components/ads/AdCard.tsx` + `AdCardFallback.tsx` + `hooks/useAdContext.ts` + `lib/ads/fallbacks.ts` + `lib/ads/categoria-segmento.ts`. Hoje sempre em modo fallback (`anuncio={null}`), direcionando para WhatsApp institucional via `lib/config/contato.ts`.

2. **Destaque de perfil do prestador** — `components/dashboard/AnunciosTab.tsx`, também direciona ao WhatsApp institucional, mas com mensagem própria (prestador interessado em destaque, não lojista). Conceitualmente relacionado a `prestadores.origem_tipo = 'vitrine'` (prioridade máxima na busca), mas não há hoje um fluxo de contratação real conectando os dois — é uma pendência de design, registrada no roadmap.

**Backend de leilão CPC** (`anunciantes`, `anuncios`, `anuncios_metricas_diarias`) — schema pronto no banco, sem "encanamento" real no frontend ainda (ver `03-banco-de-dados.md`).

---

## Papel do usuário (role)

Três dimensões independentes — não confundir:

1. **`useAuth().role`** (derivado) — `'prestador'` se existir registro em `prestadores` vinculado ao `user_id`, senão `'cliente'`. Fonte: `hooks/useAuth.ts`.
2. **`profiles.role`** (armazenado) — gravado na criação da conta por `garantirRoleInicial` (`lib/services/auth.service.ts`), nunca perguntado ao usuário.
3. **`perfis_admin`** (independente) — `owner`/`moderator`/`editor`, checado só por existência de registro no `middleware.ts` para proteger `/admin`.

**Decisão de destino pós-login:** função pura `resolverDestinoPosLogin` (`lib/auth/resolverDestinoPosLogin.ts`), único ponto de decisão — usada por `app/auth/callback/route.ts` (Google) e `hooks/useLoginForm.ts` (email/senha).

**`useSession()`** (`hooks/useSession.ts`) é uma versão mínima, só com `session` — sem resolver role. Propositalmente mais leve que `useAuth`, para telas que não precisam saber se o usuário é cliente/prestador.

---

## Slug do prestador

- **Geração/normalização:** `lib/mascaras.ts` → `formatarParaSlug`
- **Verificação de disponibilidade:** `lib/services/cadastroPrestador.service.ts` → `verificarSlugDisponivel`, consumida por `hooks/useSlugCheck.ts` (debounce de 500ms)
- **Uso na URL pública:** `app/[slug]/page.tsx`
- **Uso em links internos:** `components/dashboard/PrestadorSideCard.tsx` (`/${slug}`), `components/cards/PrestadorCard.tsx` (via `getPerfilHref`, `lib/prestadorUtils.ts`)

---

## Termos de uso / Política de privacidade

- **Páginas:** `app/termos/page.tsx`, `app/privacidade/page.tsx` — estáticas, sem I/O
- **Aceite no cadastro:** `components/perfil/SecaoTermos.tsx` — dois checkboxes com links reais para as páginas acima (abrem em nova aba)
- **Footer:** `components/Footer.tsx` — links de navegação para as mesmas páginas

---

## Categorias / Grupos / Habilidades

**Service:** `lib/services/categorias.service.ts` → `fetchGrupos`, `fetchCategoriasPorGrupo`, `fetchHabilidades`. Consumido por `hooks/useCategorias.ts`.

**Distinto de:** `lib/db/categorias.ts` → `getSugestoesDestaque`, `getSugestoesPorBusca` — usado só por `hooks/useSugestoes.ts` (autocomplete da home), com fallback estático em `config/categorias.ts` (`SUGESTOES_FALLBACK`).

**Mapeamento categoria → segmento de anúncio:** `lib/ads/categoria-segmento.ts` (`resolverSegmento`) — terceiro esquema de categorização, específico do módulo de anúncios, sem relação direta com `categorias`/`categorias_grupos` do banco.

---

## Área Administrativa

**Layout/acesso:** `middleware.ts` (Regra C, com exceção explícita para `/admin/login`), `app/(admin)/layout.tsx`, `hooks/useAdminAuth.ts`, `components/admin/{AdminSidebar,AdminHeader,SidebarLink}.tsx`.

**Por página:** ver `12-admin.md`, para a tabela completa de hook/service por rota (`/admin`, `/admin/login`, `/admin/logs`, `/admin/moderacao`, `/admin/povoar`, `/admin/habilidades`, `/admin/geografia`).

**Log de atividades no contexto admin:** todas as ações administrativas relevantes (criar habilidade, resolver/arquivar denúncia, bloquear prestador) registram via `insertLog` (`lib/db/logs.ts`) — mesma fonte única usada pelo resto do sistema, nunca uma tabela ou mecanismo à parte.

## Geolocalização, login obrigatório e vitrine paga (design em avaliação)

Ainda não implementado — ver `13-roadmap.md` para o desenho completo. Resumo de onde cada peça vai se conectar quando implementado:

- **Localização hoje:** `lib/services/localizacao.service.ts` (estado/região/cidade, sem coordenada real), `bairro` como texto livre em `prestadores`/perfis
- **Localização proposta:** coordenadas (`latitude`/`longitude`) + `endereco_texto` (via geocode Nominatim, já usado em `usePrestadores` para geolocalização silenciosa) + `raio_atuacao_km`
- **Login no ciclo do serviço hoje:** `/acompanhamento/[token]` e `/avaliar/[token]` (`hooks/useAcompanhamento`, `useAvaliar`) não exigem sessão, só o token
- **Vitrine paga proposta:** novas colunas em `prestadores` (`vitrine_lance_atual`, `vitrine_pago_ate`), independente do sistema de Anúncios (lojista/fornecedor) já existente — ver seção Anúncios acima
- **Conecta com:** `origem_tipo: 'vitrine'` (já usado hoje para prioridade máxima na busca, sem lance real por trás)

## Recuperação e alteração de senha

- **Solicitação:** `useLoginForm.ts` → `handleEsqueciSenha`
- **Definição de nova senha:** `app/recuperar-senha/page.tsx` + `hooks/useNovaSenha.ts` + `lib/services/recuperacaoSenha.service.ts`
- **Troca de senha durante edição de perfil** (já logado): `components/auth/SecaoAcessoLogado.tsx` (usado tanto no Cadastro quanto no Dashboard)
- **Componente de input de senha com toggle de visibilidade:** `components/auth/SenhaInput.tsx` (usa `EyeIconButton` internamente) — reaproveitado por `SecaoAcessoCadastro` e `SecaoAcessoLogado`. Distinto de `components/auth/EyeIconButton.tsx` (o botão isolado, usado diretamente por `NovaSenha`).

---

## Efeito Espelho (Vazamento de Papéis)

**Definição:** Bug arquitetural onde um usuário que atua simultaneamente como Prestador e Cliente visualizava os projetos que ele mesmo estava executando dentro do seu painel de Cliente, devido à busca baseada exclusivamente em `cliente_whatsapp`.

**Solução Arquitetural (Implementada):**
1. **Âncora Forte (BD):** Adição da coluna `cliente_user_id` em `portfolio_projetos` para vincular estritamente o cliente logado, isolando a busca via `getServicosPorUserId`.
2. **Filtro Anti-Espelho (Frontend):** O hook `usePainelCliente.ts` implementa uma trava de segurança `projs.filter(p => p.prestadores?.user_id !== user.id)`. Isso garante que, mesmo no fallback de busca por WhatsApp (para projetos legados), o sistema exclua da UI de cliente qualquer projeto onde o usuário logado seja o prestador em execução. A query `SELECT_SERVICOS` exige a presença de `prestadores (user_id)` para este filtro funcionar.
3. 
