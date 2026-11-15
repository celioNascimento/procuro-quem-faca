// lib/stats/metricasAnunciosStats.ts
//
// Cálculo puro usado por hooks/useMetricasAnuncios.ts: combina a lista de
// anúncios com suas métricas diárias (impressões/cliques por anuncio_id),
// soma totais, calcula CTR e ordena por engajamento. Fica fora do hook (que
// importa lib/services/adminAnunciosMetricas.service.ts e por isso precisa
// das env vars do Supabase) para poder ser testado isoladamente — ver
// metricasAnunciosStats.test.ts.

import type {
  AnuncioParaMetricas,
  MetricaDiariaApi,
} from '@/lib/services/adminAnunciosMetricas.service'

export interface MetricaDiaria {
  data_referencia: string
  impressoes: number
  cliques: number
}

export interface AnuncioComMetricas {
  id: string
  titulo: string
  posicao: string
  status: boolean
  data_expiracao: string | null
  anunciante_nome: string
  total_impressoes: number
  total_cliques: number
  ctr: number
  metricas_diarias: MetricaDiaria[]
}

function nomeDoAnunciante(a: AnuncioParaMetricas): string {
  return Array.isArray(a.anunciantes)
    ? a.anunciantes[0]?.razao_social ?? a.titulo
    : a.anunciantes?.razao_social ?? a.titulo
}

export function combinarAnunciosComMetricas(
  anuncios: AnuncioParaMetricas[],
  metricas: MetricaDiariaApi[]
): AnuncioComMetricas[] {
  const metricasPorAnuncio = new Map<string, MetricaDiaria[]>()
  for (const m of metricas) {
    const lista = metricasPorAnuncio.get(m.anuncio_id) ?? []
    lista.push({ data_referencia: m.data_referencia, impressoes: m.impressoes, cliques: m.cliques })
    metricasPorAnuncio.set(m.anuncio_id, lista)
  }

  const resultado = anuncios.map((a) => {
    const diarias = metricasPorAnuncio.get(a.id) ?? []
    const total_impressoes = diarias.reduce((s, m) => s + m.impressoes, 0)
    const total_cliques = diarias.reduce((s, m) => s + m.cliques, 0)
    const ctr = total_impressoes > 0 ? (total_cliques / total_impressoes) * 100 : 0
    return {
      id: a.id,
      titulo: a.titulo,
      posicao: a.posicao,
      status: a.status,
      data_expiracao: a.data_expiracao,
      anunciante_nome: nomeDoAnunciante(a),
      total_impressoes,
      total_cliques,
      ctr,
      metricas_diarias: diarias,
    }
  })

  resultado.sort((a, b) => {
    const aTotal = a.total_cliques + a.total_impressoes
    const bTotal = b.total_cliques + b.total_impressoes
    if (bTotal !== aTotal) return bTotal - aTotal
    return b.total_cliques - a.total_cliques
  })

  return resultado
}
