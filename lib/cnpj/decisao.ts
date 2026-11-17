// lib/cnpj/decisao.ts
// Regra de aprovação automática (doc 19, decisões de 17/11/2026):
// situação ATIVA e nome do prestador igual à razão social, ao nome fantasia ou a um sócio.
// Qualquer outro caso vai para a fila de revisão do admin.

import { normalizarNome } from './nomes'
import type { DadosCnpj } from './consulta'

export type DecisaoCnpj =
  | { status: 'aprovada'; motivo: 'automatica' }
  | { status: 'pendente'; motivo: 'situacao_nao_ativa' | 'nome_nao_confere' }

export function decidirVerificacao(nomePrestador: string, dados: DadosCnpj): DecisaoCnpj {
  if (dados.situacao !== 'ATIVA') return { status: 'pendente', motivo: 'situacao_nao_ativa' }

  const nome = normalizarNome(nomePrestador)
  const candidatos = [dados.razaoSocial, dados.nomeFantasia ?? '', ...dados.socios]
  const confere = nome !== '' && candidatos.some((c) => normalizarNome(c) === nome)

  return confere ? { status: 'aprovada', motivo: 'automatica' } : { status: 'pendente', motivo: 'nome_nao_confere' }
}
