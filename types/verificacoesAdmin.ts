// types/verificacoesAdmin.ts
// Fila de revisão de CNPJ no painel admin (retorno de admin_fila_verificacoes).

export type FiltroVerificacoes = 'pendentes' | 'aprovadas' | 'rejeitadas'

export interface VerificacaoCnpjAdmin {
  verificacao_id: string
  prestador_id: number
  prestador_nome: string | null
  prestador_slug: string | null
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'expirada'
  motivo: string | null
  criado_em: string
  verificado_em: string | null
  cnpj: string | null
  razao_social: string | null
  nome_fantasia: string | null
  situacao: string | null
  mei: boolean | null
  consultado_em: string | null
  fonte: string | null
}
