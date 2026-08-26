// lib/utils/avaliacao.utils.ts

import type { AvaliacaoRaw, Avaliacao, AvaliacoesStats } from '@/types/avaliacao'

export { type Avaliacao, type AvaliacoesStats }

const MINIMO_PARA_EXIBIR = 10

export function normalizar(raw: AvaliacaoRaw): Avaliacao {
  return {
    ...raw,
    portfolio_projetos: raw.portfolio_projetos?.[0] ?? null,
  }
}

/**
 * Nota que efetivamente conta para ranking/média.
 * Um caso de garantia resolvido (ou sem_resposta) pode setar nota_efetiva,
 * substituindo a nota original apenas para fins de cálculo — `nota` em si
 * nunca é alterada, então sempre existe um valor de fallback aqui.
 */
function notaParaCalculo(av: Avaliacao): number {
  return av.nota_efetiva ?? av.nota
}

export function calcularStats(avaliacoes: Avaliacao[]): AvaliacoesStats {
  if (avaliacoes.length === 0) {
    return { media: 0, total: 0, totalIndica: 0, distribuicao: {}, exibir: false }
  }

  const soma = avaliacoes.reduce((acc, av) => acc + notaParaCalculo(av), 0)

  // Distribuição por estrela usa a nota ORIGINAL — é uso interno (não exibido
  // publicamente; o perfil mostra indicações, não estrelas), então não precisa
  // refletir a nota_efetiva usada no ranking.
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
