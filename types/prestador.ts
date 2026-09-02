export type GarantiaDias = number

export interface Prestador {
  id: number
  created_at: string
  nome: string | null
  bio: string | null
  whatsapp: string | null
  user_id: string | null
  cliques_whatsapp: number | null
  foto_perfil: string | null
  bairro: string | null
  status: string | null
  aprovado_em: string | null
  bloqueado: boolean | null
  motivo_bloqueio: string | null
  habilidades: string[] | null
  tags: string[] | null
  estado_sigla: string | null
  cidade_id: string | null
  regiao_id: string | null
  slug: string | null
  cidades_atendidas: string[] | null
  origem_tipo: string | null
  verificado: boolean | null
  grupo_id: string | null
  categoria_id: string | null
  categoria?: string | null
  categorias?: string | null
  cidades?: { nome: string; estado_sigla: string } | null
  cidade_nome?: string | null
  regiao_nome?: string | null
  grupo_nome?: string | null
  media_nota?: number | null
  total_avals?: number | null
  ativacao_status: string
  ativacao_enviado_em: string | null
  ativacao_respondeu_em: string | null
  ativacao_obs: string | null
  garantia_dias: number
  portfolio_obrigatorio: boolean
  portfolio_titulo?: string | null
  sessao_fotos_titulo?: string | null
  sessao_fotos_urls?: string[] | null
}

export type PrestadorFormData = Partial<Prestador> & {
  id: number | null
  nome: string
  whatsapp: string
  foto_perfil: string | null
  grupo_id: string
  categoria_id: string
  estado_sigla: string
  regiao_id: string | null
  cidade_id: string | null
  bairro: string
  bio: string
  habilidades: string[]
  cidades_atendidas: string[]
  origem_tipo: string
  verificado: boolean
  status: string
  garantia_dias: number
  slug: string | null
}