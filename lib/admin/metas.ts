// lib/admin/metas.ts
//
// Metas do mês, vindas do plano de divulgação de 30 dias (doc do projeto, 20/11/2026).
// Aqui ficam só os números e a conta do progresso; quem busca os valores é o service.

export const META_CONTAS = 10 // profissionais com conta (reivindicam ou se cadastram)
export const META_TRABALHOS_NO_FEED = 3 // trabalhos finalizados e aceitos aparecendo no feed

export interface MetasDoMes {
  contas: number
  trabalhosNoFeed: number
}

export const METAS_ZERADAS: MetasDoMes = { contas: 0, trabalhosNoFeed: 0 }

export interface Progresso {
  pct: number
  cumprida: boolean
}

// Porcentagem para a barra (0 a 100) e se a meta já foi batida. Meta inválida nunca conta como cumprida.
export function progressoDaMeta(valor: number, meta: number): Progresso {
  if (!(meta > 0)) return { pct: 0, cumprida: false }
  const pct = Math.max(0, Math.min(100, Math.round((valor / meta) * 100)))
  return { pct, cumprida: valor >= meta }
}
