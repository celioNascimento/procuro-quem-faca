// lib/avaliacoes/transparencia.ts
// Transparência com o cliente: o perfil mostra o placar completo (indicam x não indicam)
// e, quando as não indicações pesam, um aviso neutro. Não muda selos nem a ordem da busca.

export const MIN_AVALIACOES_AVISO = 3
export const PERCENTUAL_AVISO = 0.3

export interface PlacarIndicacoes {
  indicam: number
  naoIndicam: number
  total: number
}

export function placarIndicacoes(indicam: number, naoIndicam: number): PlacarIndicacoes {
  const i = Math.max(0, indicam || 0)
  const n = Math.max(0, naoIndicam || 0)
  return { indicam: i, naoIndicam: n, total: i + n }
}

/** Aviso neutro quando há ao menos 3 avaliações e 30% ou mais delas são "não indico". */
export function avisoNaoIndicacoes(indicam: number, naoIndicam: number): string | null {
  const p = placarIndicacoes(indicam, naoIndicam)
  if (p.total < MIN_AVALIACOES_AVISO || p.naoIndicam / p.total < PERCENTUAL_AVISO) return null
  return `Neste perfil, ${p.naoIndicam} de ${p.total} clientes não indicam. Leia as avaliações antes de contratar.`
}
