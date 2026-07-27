//lib/utils/avaliacao.utils.ts

import type { AvaliacaoRaw, Avaliacao, AvaliacoesStats } from '@/types/avaliacao'

export { type Avaliacao, type AvaliacoesStats }

const MINIMO_PARA_EXIBIR = 10

export function normalizar(raw: AvaliacaoRaw): Avaliacao {
  return {
    ...raw,
    portfolio_projetos: raw.portfolio_projetos?.[0] ?? null,
  }
}

export function calcularStats(avaliacoes: Avaliacao[]): AvaliacoesStats {
  if (avaliacoes.length === 0) {
    return { media: 0, total: 0, totalIndica: 0, distribuicao: {}, exibir: false }
  }

  const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0)
  const distribuicao = avaliacoes.reduce<Record<number, number>>((acc, av) => {
    acc[av.nota] = (acc[av.nota] ?? 0) + 1
    return acc
  }, {})

  return {
    media: parseFloat((soma / avaliacoes.length).toFixed(1)),
    total: avaliacoes.length,
    totalIndica: avaliacoes.filter(av => av.indica).length,
    distribuicao,
    exibir: avaliacoes.length >= MINIMO_PARA_EXIBIR,
  }
}