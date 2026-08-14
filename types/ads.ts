// types/ads.ts

// --- Tipagens já existentes ---
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
  id?: string 
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
  segmentacao_id_ativa?: string
}

// --- Novas Tipagens do Admin de Anúncios ---
export type Segmentacao = {
  id?: string
  estadoSigla: string
  regiaoId: string
  cidadeId: string
  grupoId: string
  categoriaId: string
  valorCobrado: number
}

export type AnuncioComAnunciante = {
  id: string
  status: boolean
  tipo: string
  titulo: string
  link_destino: string | null
  imagem_url: string | null
  posicao: string
  publico_alvo: string
  status_aprovacao: string
  anunciante_id: string
  data_inicio: string | null
  data_expiracao: string | null
  valor_total: number
  created_at: string
  segmentacao_id_ativa?: string // Necessário para rastreamento preciso de métricas
  anunciantes: {
    id: string
    razao_social: string
    whatsapp: string | null
  } | null
  anuncios_segmentacoes: {
    id: string
    estado_sigla: string
    regiao_id: string
    cidade_id: string
    grupo_id: string
    categoria_id: string
    valor_cobrado: number
  }[]
}

export type NovoAnuncioInput = {
  anuncianteId: string
  titulo: string
  linkDestino: string
  imagemUrl: string
  posicao: string
  ativo: boolean
  dataInicio: string | null
  dataExpiracao: string | null
  valorTotal: number
  segmentacoes: Segmentacao[]
}

export type ValidacaoSegmentacoes =
  | { ok: true }
  | { ok: false; mensagem: string }

export type AnuncioLojistaFormValues = {
  lojista: { email: string; razaoSocial: string; whatsapp: string }
  anuncio: {
    titulo: string
    linkDestino: string
    imagemUrl: string
    posicao: string
    ativo: boolean
    dataInicio: string | null
    dataExpiracao: string | null
    valorTotal: number
    segmentacoes: Segmentacao[]
  }
  imagemFile: File | null
  idExistente: string | null
  anuncianteIdExistente: string | null
}
