// lib/cnpj/decisao.ts
// Regra de aprovação automática (doc 19, decisões de 17/11/2026):
// situação ATIVA e nome do prestador igual à razão social, ao nome fantasia ou a um sócio.
// Qualquer outro caso vai para a fila de revisão do admin.

import { normalizarNome } from './nomes'
import type { DadosCnpj } from './consulta'

export type DecisaoCnpj =
  | { status: 'aprovada'; motivo: 'automatica' }
  | { status: 'pendente'; motivo: 'situacao_nao_ativa' | 'nome_nao_confere' }

/** `nomes`: o nome do perfil e, se houver, o nome completo da conta; qualquer um que bata aprova. */
export function decidirVerificacao(nomes: string | readonly string[], dados: DadosCnpj): DecisaoCnpj {
  if (dados.situacao !== 'ATIVA') return { status: 'pendente', motivo: 'situacao_nao_ativa' }

  const procurados = (Array.isArray(nomes) ? nomes : [nomes]).map(normalizarNome).filter((n) => n !== '')
  const candidatos = [dados.razaoSocial, dados.nomeFantasia ?? '', ...dados.socios].map(normalizarNome)
  const confere = procurados.some((n) => candidatos.includes(n))

  return confere ? { status: 'aprovada', motivo: 'automatica' } : { status: 'pendente', motivo: 'nome_nao_confere' }
}
