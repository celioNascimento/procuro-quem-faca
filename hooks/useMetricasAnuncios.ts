// hooks/useMetricasAnuncios.ts
//
// Carrega os anúncios + suas métricas diárias (período configurável) e
// combina os dois em uma lista pronta para a UI (total de impressões/
// cliques, CTR, ordenada por engajamento). Usado por
// components/admin/anuncios/MetricasAnuncios.tsx.

import { useState, useEffect, useCallback } from 'react'
import {
  listarAnunciosParaMetricas,
  buscarMetricasDiarias,
  type AnuncioParaMetricas,
  type MetricaDiariaApi,
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

function combinarAnunciosComMetricas(
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

export function useMetricasAnuncios(periodoDias: 7 | 14 | 30) {
  const [anuncios, setAnuncios] = useState<AnuncioComMetricas[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - periodoDias)
      const dataInicioStr = dataInicio.toISOString().slice(0, 10)

      const [listaAnuncios, metricas] = await Promise.all([
        listarAnunciosParaMetricas(),
        buscarMetricasDiarias(dataInicioStr),
      ])

      setAnuncios(combinarAnunciosComMetricas(listaAnuncios, metricas))
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [periodoDias])

  useEffect(() => {
    queueMicrotask(() => carregar())
  }, [carregar])

  return { anuncios, loading, erro }
}
