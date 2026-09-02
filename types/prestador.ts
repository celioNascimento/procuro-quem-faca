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
  ativacao_status: string
  ativacao_enviado_em: string | null
  ativacao_respondeu_em: string | null
  ativacao_obs: string | null
  garantia_dias: number
  portfolio_obrigatorio: boolean // ← NEW FIELD
  portfolio_titulo?: string | null
}
