# Busca e listagem de prestadores

Página de resultados: `app/prestadores/page.tsx`. As regras puras ficam em `lib/buscaFiltros.ts` (testadas); o carregamento, em `hooks/usePrestadores.ts`; a leitura do banco, em `lib/db/prestadores.ts`.

## Cidade da busca

A busca combina o serviço com a cidade. Prioridade (quem vale primeiro):

1. Cidade escrita no texto: `Massoterapia em Maringá`.
2. Cidade escolhida nos filtros ou já na URL (`?cidade=`). O parâmetro leva o **id da cidade** (duas cidades de estados diferentes podem ter o mesmo nome); links antigos com o nome continuam funcionando.
3. Cidade salva do usuário (cookie `pqf_cidade`, 30 dias, com id e nome). É só o ponto de partida e filtra pelo id.

Escolher **Estado** ou **Região** solta a cidade salva (são recortes mais amplos). A busca **não** usa `cidades_atendidas` para ampliar resultados.

**A cidade em vigor aparece para a pessoa.** O título diz `Profissionais em Londrina` ou `Resultados para "pedreiro" em Londrina`; sem cidade conhecida o título é genérico (`Profissionais cadastrados`, nunca "sua região"). Logo abaixo, numa linha só, `Ver outras cidades` à esquerda e o contador (`24 encontrados`) à direita (`components/busca/CidadeDaBusca.tsx`); a cidade em si fica só no título, sem repetir. Se a cidade foi escrita na própria busca, o título também a mostra.

**Ver outras cidades** coloca `?ampliar=1` na URL e tira `?cidade=`: a cidade salva deixa de valer e a lista traz todas as cidades (com a linha `Todas as cidades · Voltar para Londrina`). Escolher uma cidade nos filtros desfaz o `ampliar`. Na tela de "nenhum resultado" com cidade em vigor, o botão principal é o mesmo.

| Consulta | Resultado esperado |
| --- | --- |
| `Massoterapia` com cidade salva Londrina | Londrina (título "em Londrina") |
| `Massoterapia em Maringá` | Maringá (título só com a busca) |
| `Massoterapia` + `ampliar=1` | Todas as cidades |
| Filtro manual Maringá | Maringá |
| Sem cidade salva | Todas as cidades, título genérico, convite de localização |

## Localização do aparelho (convite)

Sem cidade salva, a página de resultados **e a página inicial** mostram o convite `components/busca/ConviteLocalizacao.tsx`: explica que, com a localização, mostramos primeiro quem atende na cidade da pessoa, que usamos só para descobrir a cidade e não guardamos a posição (texto igual ao da Política de Privacidade, seção 8).

- O navegador **só é consultado depois do toque em "Usar minha localização"**. Antes, a localização era pedida sozinha em qualquer página e a lista ficava em "carregando" até a pessoa responder.
- A lista **não espera** a localização: carrega na hora; ao chegar a cidade, ela é refinada.
- Sem recarregar a página (antes havia um `window.location.reload()`).
- Estados tratados: pedindo, negado, sem cidade atendida por perto, erro (com "Tentar de novo") e aparelho sem localização. "Agora não" some por 30 dias (`localStorage`).
- Coordenadas vão ao OpenStreetMap (Nominatim) só para achar a cidade e não são guardadas (`lib/localizacao.ts`).

## Filtros e contagens

Filtros: Estado → Região → Cidade e Área → Categoria, em cascata (mudar o pai limpa os filhos). Atualizam a URL com `router.replace`.

A contagem ao lado de cada opção é **o que sobra ao escolhê-la** (`calcularFacetas`): o "pai" ignora os filtros dos filhos (dá para trocar de estado com uma cidade escolhida) e os filhos respeitam os pais; Local e Área se influenciam. A categoria só fica disponível depois de escolher uma Área (a tela diz isso).

## Ordem dos resultados (`lib/ordenacao.ts`)

Vitrine → perfis reais (cadastro direto `registro_direto`, assumido `reivindicado`; `proprio` é nome antigo) → curadoria pública. Dentro da faixa, nota melhor primeiro; **verificado sobe uma faixa**. A nota é a mesma do perfil público (`nota_efetiva` quando existe; só avaliações visíveis e fora de disputa). Em empate, vale a ordem de cadastro.

O selo "Verificado" **ainda não aparece no card**: só será mostrado quando existir algo verificado de fato, na fase de qualificações do prestador.

## Mostrar 10 por vez

A lista (`components/busca/ResultadosPaginados.tsx`) mostra 10 cards e o botão **Ver mais** abre mais 10 (`Mostrando 10 de 183`). Mudou a busca ou um filtro, volta aos 10 primeiros (o componente é remontado por `key`). Ao voltar do perfil, reabre com a mesma quantidade (`salvarQuantidadeVisivel` / `quantidadeVisivelSalva` em `lib/navegacao.ts`), para a rolagem restaurada cair no lugar certo.

Anúncios: um a cada 4 cards, só nos cards visíveis; a decisão de cada posição é estável (não muda ao clicar em "Ver mais") — `lib/anunciosEntreCards.ts`. O inventário de anúncio só é consultado para as praças dos cards visíveis.

Limite: a página ainda baixa os perfis da cidade (ou do catálogo todo) de uma vez e pagina na tela. Isso economiza renderização e consultas de anúncio, não o download. Quando o catálogo crescer muito, mover busca e filtros para o servidor (ver `13-roadmap.md`).

## Leitura do banco (`lib/db/prestadores.ts`)

- O Supabase corta consultas em ~1000 linhas **sem avisar**. `lerTodasAsPaginas` lê página por página usando a contagem total (com 949 ativos em 14/11/2026, o corte aconteceria em breve e sumiria quem estivesse no fim).
- Só as colunas que a lista usa (antes era `select('*')`, que trazia WhatsApp e bio de todos).
- Cidade salva igual à cidade em vigor → consulta só a cidade (menos dados). Caso contrário, catálogo todo.
- Em falha, a tela mostra o aviso com **Tentar de novo**.

## Página (detalhes)

- Menu de filtros (computador) sempre ocupa a coluna da esquerda, mesmo carregando (antes a lista "caía" na coluna estreita e pulava); durante a recarga mantém as opções antigas.
- No celular, o painel de filtros fechado fica fora do teclado e dos leitores de tela, fecha com Esc e devolve o foco ao botão.
- Card: nome é `h2`; letras de no mínimo 12 px.
- `app/prestadores/layout.tsx` marca a página como `noindex, follow`: cada combinação de busca/filtro é um endereço novo com conteúdo quase igual; o Google já tem as páginas de serviço + cidade (sitemap) e os perfis. Não bloquear no `robots.txt`, senão o Google não lê o `noindex`.

## Implementação relacionada

- `app/prestadores/page.tsx`, `app/prestadores/layout.tsx`, `app/page.tsx` (envia a busca)
- `hooks/usePrestadores.ts`, `hooks/useFiltrosParams.ts`, `hooks/useFiltrosPrestadores.ts`, `hooks/useRestaurarScroll.ts`
- `lib/buscaFiltros.ts`, `lib/ordenacao.ts`, `lib/prestadorUtils.ts` (`getTituloBusca`), `lib/anunciosEntreCards.ts`, `lib/localizacao.ts`, `lib/contexts/LocationContext.tsx`
- `components/busca/*`, `components/filtros/*`, `components/cards/PrestadorCard.tsx`

## Navegação e voltar

- Filtros da lista atualizam a URL com `router.replace` (não criam entrada no histórico).
- `usePrestadores` mantém cache em memória por 3 min; `useRestaurarScroll` devolve a rolagem ao voltar do perfil.
- Regras completas em [18-navegacao-voltar.md](18-navegacao-voltar.md).

## Vitrine, anúncio de topo, card e filtros

- **Vitrine (`origem_tipo = 'vitrine'`)**: fica sempre no topo (peso -1 em `lib/ordenacao.ts`), mas passa pelo mesmo filtro de termo dos demais perfis: uma vitrine de eletricista não aparece numa busca por pedreiro. Sem termo, todas aparecem. Local e Área filtram todos igualmente.
- **Cidades com o mesmo nome**: o menu "Cidade" lista uma opção por id; se houver nomes repetidos o rótulo ganha a sigla ("Santa Helena - PR"). Regra em `opcoesDeCidade` (`lib/buscaFiltros.ts`).
- **Anúncios nas páginas públicas** vêm de `lib/services/anunciosPublicos.service.ts` (anúncio de topo, anúncios entre cards, inventário da praça, métricas). `adminAnuncios.service.ts` reexporta essas funções para o painel admin; páginas públicas não importam mais o serviço administrativo.
- **Card (`PrestadorCard`)**: compacto (~110 px): foto (ou ícone da área), nome, categoria e cidade juntos, uma seta à direita e, abaixo, as habilidades em uma linha. O card inteiro é o link do perfil. Perfis da curadoria (dados públicos de contato) não têm selo; só o link "Este perfil é seu?" ao lado da cidade (área de toque de 44 px), em cinza e sublinhado para não competir com o nome. Ele **fica em todo card da curadoria de propósito**: uma faixa única no fim da lista faria a pessoa esquecer, rolando, que esses perfis foram montados com dados públicos. As iniciais ignoram palavras de ligação (`getIniciais`: "Construções e Reformas" → "CR").
- **Anúncio entre cards (`AdCardFallback`)**: mesma linguagem dos cards (fundo branco, cantos de 2rem, letras de 14 px ou mais, rótulo "Anúncio"). O campo `cor` dos fallbacks em `lib/ads/fallbacks.ts` não é mais usado. O mesmo componente aparece nos painéis.
- **Filtros de opção única**: um filtro com uma só opção que não está marcada não aparece (não muda nada). Se só há uma Área, a Categoria já fica liberada.
- **Cidade escrita na busca**: o botão "Ver outras cidades" aparece também nesse caso. O botão tira "em Maringá" do texto (`?q=pedreiro`) e amplia. A tela vazia com cidade em vigor oferece o mesmo botão.
- **Cabeçalho** (todo o app): `components/HeaderBase.tsx` é a casca única do `Header` (público) e do `HeaderCliente`. Logo centralizada (grade de 3 colunas: voltar | logo | ações, então ela fica no centro mesmo com a direita mais larga), fio azul/amarelo da marca no topo, fundo branco sólido. **Altura: 64 px no celular (`h-16`) e 72 px a partir de `md` (`md:h-18`)**; antes eram 112 px. Cada página reserva esse espaço (`pt-16 md:pt-18` ou com folga: `md:pt-22` = +16 px, `md:pt-26` = +32 px) e os itens `sticky` usam `top-16 md:top-18` (ou `top-22`/`top-26` com folga). Se a altura mudar, revise esses valores. `<Header larga />` usa `max-w-6xl` (alinhado ao conteúdo da lista); os demais, `max-w-5xl`. Botões do cabeçalho: texto normal de 14 px, área de toque de 44 px, "Entrar" em azul. Os botões da home (`HeaderBotoes`) seguem o mesmo estilo. A logo do cabeçalho (`Logo variant="header"`) tem 144 px (celular) e 208 px (computador) de largura.
- **Tom da página**: brilho azul suave no topo (mesmo clima da home); sem foto, o avatar mostra o **ícone da área** (`lib/areaVisual.ts`, vindo de `categorias_grupos.icone`: sparkles, hammer, home, cpu, heart, book, star, cada um com uma cor) e, se o ícone for desconhecido, as iniciais coloridas (`corDasIniciais`). Topo enxuto: título, uma linha (trocar cidade + contador) e a **dica da primeira visita** (`components/busca/DicaDaLista.tsx`: como tocar/chamar, orçamento grátis e o que significa "Este perfil é seu?"); "Entendi" a esconde neste aparelho (`localStorage`, chave `pqf:dica-lista`). O que ainda deixa a lista "fria" é falta de conteúdo, não de layout (14/11/2026: 950 ativos, 940 da curadoria pública, 9 com foto, 1 com avaliação, 928 com a mesma bio genérica); a lista não carrega bio nem WhatsApp de propósito (`COLUNAS_LISTA`). Alavancas futuras: fotos reais, avaliações, portfólio.
- **Anúncio no topo da lista**: sem anúncio pago, aparece a divulgação do PQF em **faixa fina** (`AdCardFallback compacto`, ~56 px), para os profissionais aparecerem na primeira tela e a divulgação continuar visível. Entre os cards segue a versão grande.
- **Rodapé e botão Filtros (celular)**: o botão flutuante some ao chegar no rodapé (`IntersectionObserver` em `FiltroBottomSheet`); não há mais espaço reservado vazio no fim da lista. Links do rodapé com 14 px e área de toque de 28 px (acima do mínimo de 24 px da WCAG 2.2; 36 e 44 px deixavam as fileiras de links afastadas demais ao quebrar linha no celular). O © fica 12 px abaixo da última fileira, mais longe que as fileiras entre si, e o fim do rodapé respeita a área segura do celular.
- **Esqueletos de carregamento** (`components/skeletons/ListaSkeletonPrestadores.tsx`): `CardsSkeleton` (cartão compacto de ~110 px, 1 coluna no celular e 2 no desktop) é usado dentro da página enquanto a busca carrega; `ListaSkeleton` (coluna de filtros + título + cartões) vale até a leitura da URL terminar. Seguem as medidas do card real para nada pular quando os resultados chegam; mudou o card, ajuste-os juntos.
