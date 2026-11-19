// lib/selos/cnpjEstado.ts
// Em que fase está o selo de CNPJ do prestador, a partir do que o banco devolve (só leitura, sem rede).

export type FaseSeloCnpj = 'sem' | 'aprovado' | 'em_conferencia' | 'rejeitado' | 'expirado'

export interface DadosSeloCnpj {
  verificacao: { status: string; valido_ate: string | null; verificado_em: string | null } | null
  cnpj: {
    cnpj: string; razao_social: string | null; consultado_em: string; situacao: string | null
    cnae_codigo?: string | null; cnae_descricao?: string | null
    cnaes_secundarios?: string[] | null; cnaes_detalhe?: { codigo: string; descricao: string | null }[] | null
  } | null
}

/** Data local no formato AAAA-MM-DD, para comparar com colunas do tipo date. */
function hojeIso(agora: Date): string {
  const m = String(agora.getMonth() + 1).padStart(2, '0')
  const d = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${m}-${d}`
}

export function faseDoSeloCnpj(dados: DadosSeloCnpj, agora: Date = new Date()): FaseSeloCnpj {
  const v = dados.verificacao
  if (!v) return 'sem'
  switch (v.status) {
    case 'aprovada':
      return v.valido_ate && v.valido_ate < hojeIso(agora) ? 'expirado' : 'aprovado'
    case 'pendente':
    case 'em_analise':
      return 'em_conferencia'
    case 'rejeitada':
      return 'rejeitado'
    case 'expirada':
      return 'expirado'
    default:
      return 'sem'
  }
}
