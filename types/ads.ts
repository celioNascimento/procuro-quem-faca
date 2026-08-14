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
  id?: string // presente quando o anúncio vem de listarAnunciosAtivosPorPraca (venda direta 'proprio')
  adsense_slot?: string
  adsense_client?: string
  tipo?: 'vip' | 'proprio' | 'google'
  posicao?: string
  imagem_url?: string
  link_destino?: string
  titulo?: string
  data_inicio?: string
  data_expiracao?: string
  valor_total?: number
  // id da linha em anuncios_segmentacoes que casou com a praça (cidade+
  // categoria) buscada — necessário para registrar métricas de impressão/
  // clique na segmentação correta, já que um anúncio pode ter várias.
  // Ver AnuncioComAnunciante em lib/services/adminAnuncios.service.ts.
  segmentacao_id_ativa?: string
}
