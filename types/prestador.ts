export type Prestador = {
  id: string
  slug: string | null
  nome: string
  foto_perfil: string | null
  origem_tipo: 'vitrine' | 'proprio' | 'reivindicado' | 'curadoria_publica'
  verificado: boolean
  categoria: string
  habilidades: string[]
  bairro?: string
  cidades?: { nome: string } | null
  media_nota: number
  total_avals: number
}