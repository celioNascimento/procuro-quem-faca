// lib/utils/variacaoVisitas.ts
//
// Variação percentual de visitas entre dois períodos de mesma duração
// (por exemplo, últimos 7 dias contra os 7 dias anteriores).
//
// Decisão de produto (30/10/2026): o painel do prestador mostra só a variação
// POSITIVA. Uma queda como −58% desanima e muitas vezes vem de uma campanha que
// acabou, não de um problema do perfil. A base para mostrar a negativa já está
// pronta: troque MOSTRAR_VARIACAO_NEGATIVA para true. O cálculo, o tipo e o card
// já tratam o sentido 'queda'.

export const MOSTRAR_VARIACAO_NEGATIVA = false

export type VariacaoVisitas = {
  /** Percentual inteiro. Positivo para alta, negativo para queda. */
  percentual: number
  sentido: 'alta' | 'queda'
}

/**
 * Variação percentual arredondada, ou null quando não há base de comparação
 * (período anterior zerado ou valores inválidos).
 */
export function calcularVariacaoPercentual(atual: number, anterior: number): number | null {
  if (!Number.isFinite(atual) || !Number.isFinite(anterior)) return null
  if (atual < 0 || anterior <= 0) return null
  return Math.round(((atual - anterior) / anterior) * 100)
}

/**
 * O que o card deve exibir para a variação, ou null quando não há nada a mostrar:
 * sem base, sem mudança (inclusive arredondando para 0%) ou queda com a exibição
 * de quedas desligada.
 */
export function variacaoParaExibir(
  atual: number,
  anterior: number,
  opcoes: { mostrarNegativa?: boolean } = {},
): VariacaoVisitas | null {
  const { mostrarNegativa = MOSTRAR_VARIACAO_NEGATIVA } = opcoes
  const percentual = calcularVariacaoPercentual(atual, anterior)

  if (percentual === null || percentual === 0) return null
  if (percentual > 0) return { percentual, sentido: 'alta' }
  return mostrarNegativa ? { percentual, sentido: 'queda' } : null
}