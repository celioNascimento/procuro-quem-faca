// types/ads.ts

export type AdPage =
  | 'prestadores'
  | 'perfil_prestador'
  | 'busca_servicos'
  | 'lista_topo'

export type AdFallback = {
  emoji: string
  titulo: string
  subtitulo: string
  cta: string
  href: (contexto?: string) => string
  cor: string
}

export type Anuncio = {
  adsense_slot?: string
  adsense_client?: string
  tipo?: 'vip' | 'proprio' | 'google'
  posicao?: string
  imagem_url?: string
  link_destino?: string
  titulo?: string
}