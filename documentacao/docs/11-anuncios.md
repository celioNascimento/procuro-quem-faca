# Sistema de Anúncios — PQF

Complementa `02-arquitetura.md`. Ver `14-glossario.md` para a distinção completa entre os dois sistemas (lojista/fornecedor vs. destaque de perfil do prestador) e todos os pontos que montam link de WhatsApp.

**`AdCard.tsx`** — modo AdSense real (checagem 2s + `offsetHeight` para adblock) ou fallback. **`AdCardFallback.tsx`** — renderiza `fallback` (cor/emoji/título/subtítulo/cta/href) vindo de `useAdContext`.

**`useAdContext.ts`** → `resolverSegmento` (`lib/ads/categoria-segmento.ts`) + `getFallbackPorSegmento` (`lib/ads/fallbacks.ts`, 8 segmentos + `geral`). Recalculado via `useState` com inicializador — não reage a mudanças de `categoria` após a primeira renderização (candidato a `useMemo` se o fallback precisar acompanhar filtros de busca dinâmicos, ver `13-roadmap.md`).

Hoje sempre em modo fallback, direcionando ao WhatsApp institucional (`lib/config/contato.ts`).

**Destaque de perfil do prestador** (`components/dashboard/AnunciosTab.tsx`) — sistema conceitualmente distinto, ver `06-dashboard-prestador.md` e o design de "vitrine paga" em `13-roadmap.md`.

**Backend de leilão CPC** (`anunciantes`, `anuncios`, `anuncios_metricas_diarias`) — schema pronto no banco (`03-banco-de-dados.md`), sem "encanamento" real no frontend ainda; `AdCard` sempre recebe `anuncio={null}`.

**Peças não revisadas:** ponto de integração real com `anuncios`/`anunciantes`.