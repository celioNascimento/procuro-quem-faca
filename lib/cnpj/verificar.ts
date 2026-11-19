// lib/cnpj/verificar.ts
// Fluxo de verificação de CNPJ do prestador, sem acesso direto ao banco:
// recebe o repositório e a consulta por parâmetro, o que permite testar sem rede nem Supabase.

import { cnpjValido, normalizarCnpj } from './validacao'
import { consultarCnpj, type DadosCnpj, type ResultadoConsulta } from './consulta'
import { decidirVerificacao } from './decisao'
import { mensagemCnpjNaoAtivo } from './situacao'

// Dias de validade do selo. A reconsulta mensal (job pg_cron, ainda não criado) renova antes do fim.
export const DIAS_VALIDADE_SELO = 35

export type RepositorioCnpj = {
  /** true se o CNPJ já está ligado a outro prestador. */
  cnpjEmUsoPorOutro(cnpj: string, prestadorId: number): Promise<boolean>
  /** Grava prestador_cnpj e prestador_verificacoes (upsert). */
  gravar(entrada: {
    prestadorId: number
    dados: DadosCnpj
    status: 'aprovada' | 'pendente'
    motivo: string
    validoAte: string
  }): Promise<void>
}

export type ResultadoVerificacao =
  | { http: 400; corpo: { erro: string } }
  | { http: 409; corpo: { erro: string } }
  | { http: 422; corpo: { erro: string } }
  | { http: 503; corpo: { erro: string } }
  | { http: 200; corpo: { status: 'aprovada' | 'pendente'; mensagem: string } }

export async function verificarCnpj(
  entrada: { prestadorId: number; nomesPrestador: readonly string[]; cnpjBruto: unknown },
  deps: {
    repositorio: RepositorioCnpj
    consultar?: (cnpj: string) => Promise<ResultadoConsulta>
    agora?: () => Date
  },
): Promise<ResultadoVerificacao> {
  if (typeof entrada.cnpjBruto !== 'string') return { http: 400, corpo: { erro: 'Informe o CNPJ.' } }
  const cnpj = normalizarCnpj(entrada.cnpjBruto)
  if (!cnpjValido(cnpj)) return { http: 400, corpo: { erro: 'CNPJ inválido. Confira os números e letras digitados.' } }

  if (await deps.repositorio.cnpjEmUsoPorOutro(cnpj, entrada.prestadorId)) {
    return { http: 409, corpo: { erro: 'Este CNPJ já está vinculado a outro perfil.' } }
  }

  const consultar = deps.consultar ?? ((c: string) => consultarCnpj(c))
  const r = await consultar(cnpj)
  if (!r.ok) {
    if (r.motivo === 'nao_encontrado') {
      return { http: 422, corpo: { erro: 'Não encontramos este CNPJ na Receita Federal.' } }
    }
    return { http: 503, corpo: { erro: 'A consulta está indisponível agora. Tente de novo em alguns minutos.' } }
  }

  // CNPJ que não está ativo não tem o que a equipe decidir: só a regularização na Receita muda isso.
  // Avisamos o prestador na hora e não gravamos nada.
  if (r.dados.situacao !== 'ATIVA') {
    return { http: 422, corpo: { erro: mensagemCnpjNaoAtivo(r.dados.situacao) } }
  }

  const decisao = decidirVerificacao(entrada.nomesPrestador, r.dados)
  const agora = (deps.agora ?? (() => new Date()))()
  const validoAte = new Date(agora.getTime() + DIAS_VALIDADE_SELO * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  await deps.repositorio.gravar({
    prestadorId: entrada.prestadorId,
    dados: r.dados,
    status: decisao.status === 'aprovada' ? 'aprovada' : 'pendente',
    motivo: decisao.motivo,
    validoAte,
  })

  if (decisao.status === 'aprovada') {
    return { http: 200, corpo: { status: 'aprovada', mensagem: 'CNPJ confirmado. Selo ativo no seu perfil.' } }
  }
  return {
    http: 200,
    corpo: { status: 'pendente', mensagem: 'Recebemos seu CNPJ. Nossa equipe vai conferir e avisar você.' },
  }
}
