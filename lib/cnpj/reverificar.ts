// lib/cnpj/reverificar.ts
// Reconsulta diária dos selos de CNPJ perto de vencer (decisões de 17/11/2026):
//  - CNPJ ainda ATIVO: renova a validade (o banco decide e grava; o nome não é reconferido);
//  - CNPJ não ATIVO: o selo é pausado e o prestador é avisado no painel para regularizar (sem fila do admin);
//  - fontes fora do ar ou CNPJ não encontrado: nada muda; tenta de novo no próximo dia e, se a validade
//    vencer antes disso, o selo expira sozinho (função cnpj_expirar_vencidos).
// Lógica pura: o acesso ao banco e à Receita entra por parâmetro, para testar sem rede.

import type { ResultadoConsulta } from './consulta'

export type PendenteReverificacao = { prestadorId: number; cnpj: string }
export type ResultadoRegistro = 'renovada' | 'selo_pausado' | 'ignorada'

export type RepositorioReverificacao = {
  listarPendentes(limite: number): Promise<PendenteReverificacao[]>
  registrar(prestadorId: number, situacao: string, fonte: string): Promise<ResultadoRegistro>
}

export type ResumoReverificacao = {
  analisados: number
  renovados: number
  selosPausados: number
  ignorados: number
  semResposta: number // fontes fora do ar ou CNPJ não encontrado agora: tenta de novo amanhã
  erros: number
}

export const LIMITE_POR_EXECUCAO = 20

export async function reverificarCnpjs(deps: {
  repositorio: RepositorioReverificacao
  consultar: (cnpj: string) => Promise<ResultadoConsulta>
  limite?: number
}): Promise<ResumoReverificacao> {
  const resumo: ResumoReverificacao = {
    analisados: 0, renovados: 0, selosPausados: 0, ignorados: 0, semResposta: 0, erros: 0,
  }
  const pendentes = await deps.repositorio.listarPendentes(deps.limite ?? LIMITE_POR_EXECUCAO)

  // Um de cada vez: as fontes gratuitas limitam o ritmo, e um erro num CNPJ não pode parar os outros.
  for (const p of pendentes) {
    resumo.analisados += 1
    try {
      const consulta = await deps.consultar(p.cnpj)
      if (!consulta.ok) {
        resumo.semResposta += 1
        continue
      }
      const r = await deps.repositorio.registrar(p.prestadorId, consulta.dados.situacao, consulta.dados.fonte)
      if (r === 'renovada') resumo.renovados += 1
      else if (r === 'selo_pausado') resumo.selosPausados += 1
      else resumo.ignorados += 1
    } catch {
      resumo.erros += 1
    }
  }
  return resumo
}
