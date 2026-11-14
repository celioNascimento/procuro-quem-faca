# Navegação e botão "voltar"

Regras únicas de "voltar" do app. Código em [`lib/navegacao.ts`](../../lib/navegacao.ts), [`hooks/useVoltar.ts`](../../hooks/useVoltar.ts), [`hooks/useRestaurarScroll.ts`](../../hooks/useRestaurarScroll.ts) e [`components/NavegacaoTracker.tsx`](../../components/NavegacaoTracker.tsx).

## Princípio

"Voltar" **desfaz a navegação** (`history.back`); nunca empilha uma nova entrada. Só quando não existe página anterior do app (link aberto direto, nova aba, WhatsApp, Google) o app usa uma rota de **fallback** com `router.replace`.

Antes, a seta do `Header` era um `<Link href>`: o "voltar" do navegador levava de volta ao perfil (laço perfil ⇄ lista).

## Como decide

`podeVoltarNoApp()` usa `window.navigation.canGoBack` (Navigation API, só conta entradas do mesmo site). Sem essa API, usa `history.length > 1` + `document.referrer` do mesmo origin.

| Peça | Papel |
|---|---|
| `voltarOuIr(router, fallback)` | Volta se houver histórico do app; senão `replace(fallback)`. |
| `useVoltar(fallback)` | Hook que devolve a ação pronta para `onClick`. |
| `BackButton` / `Header` | A prop `href` agora é só o **fallback**. |
| `sanitizarRotaInterna(valor)` | Aceita só caminhos internos (`/x?y=1`); rejeita `//host`, `https://…`, `\`. Recebe valor já decodificado. |

## Fluxo do perfil público

1. A busca monta o link com `getPerfilHref` → `/<slug>?from=<url da busca>`.
2. `usePerfilPrestador` lê `from` **uma vez** (por `slug`), valida com `sanitizarRotaInterna`, registra `VISITA_PERFIL_VIA_BUSCA` e remove `from` da URL.
3. Seta do perfil: com histórico → volta à busca exata (filtros e rolagem); sem histórico → fallback `urlRetorno` (`from`, ou `/prestadores?q=<categoria>`).
4. Vindo do dashboard (`/<slug>` sem `from`), o histórico devolve ao dashboard.

## Lista de busca

- **Filtros** usam `router.replace` (refinam a mesma tela). Um filtro não cria entrada no histórico.
- **Cache** em memória (`cacheLista` em `usePrestadores`, TTL 3 min, chave = termo + habilidade + cidade da consulta): voltar do perfil não mostra skeleton.
- **Rolagem**: `useRestaurarScroll(!loading)` salva `scrollY` por URL em `sessionStorage` e restaura só quando a chegada foi por voltar/avançar. `NavegacaoTracker` (layout raiz) marca `popstate`; o marcador vale 15 s e é consumido uma vez. Visita nova começa no topo. A quantidade de cards abertos ("Ver mais") é guardada junto (`salvarQuantidadeVisivel`) e só é devolvida na chegada por voltar/avançar, para a rolagem restaurada cair no lugar certo.

## Fallbacks por tela

| Tela | Fallback |
|---|---|
| `/prestadores` | `/` |
| Perfil público | `urlRetorno` |
| `(dashboard)` | `/dashboard`; na própria `/dashboard`, `/` |
| `termos`, `privacidade`, `ajuda`, `HeaderCliente` | `/` |
| `denunciar/[id]` | `/prestadores` |
| `cadastro`, `reivindicar`, `quem-somos` | `/` |

## Regras para novas telas

- Não usar `router.back()` direto nem `<Link>` como seta de voltar: use `useVoltar(fallback)` ou `<Header href="<fallback>">`.
- Filtros/abas que só refinam a tela: `router.replace`. Navegação para outra tela: `push`/`<Link>`.
- Qualquer valor de URL usado como destino passa por `sanitizarRotaInterna`.

## Testes

[`lib/navegacao.test.ts`](../../lib/navegacao.test.ts) cobre sanitização e a decisão voltar × fallback. Verificação manual: busca → rolar → perfil → seta e "voltar" do navegador; perfil em nova aba → seta; perfil pelo dashboard → seta.
