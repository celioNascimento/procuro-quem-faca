// types/adsbygoogle.d.ts
//
// O script do Google AdSense cria window.adsbygoogle em tempo de execução, e o
// components/ads/AdCard.tsx empilha os slots nele. Sem esta declaração, o tsc
// acusa "Property 'adsbygoogle' does not exist on type 'Window'".

interface Window {
  adsbygoogle?: unknown[]
}
