export type Prestador = {
  // Campos do banco
  id: string
  slug: string | null
  nome: string
  foto_perfil: string | null
  origem_tipo: 'vitrine' | 'proprio' | 'reivindicado' | 'curadoria_publica'
  verificado: boolean
  habilidades: string[]
  bairro?: string
  cidades_atendidas?: string[]
  cidades?: { nome: string; estado_sigla: string; regiao_id: string } | null
  categorias?: { nome: string } | null

  // Campos computados pelo hook
  cidade_nome: string
  categoria: string
  media_nota: number
  total_avals: number
}