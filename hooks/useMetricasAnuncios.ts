// hooks/useMetricasAnuncios.ts
//
// Carrega os anúncios + suas métricas diárias (período configurável) e
// combina os dois em uma lista pronta para a UI (total de impressões/
// cliques, CTR, ordenada por engajamento). Usado por
// components/admin/anuncios/MetricasAnuncios.tsx.
//
// O cálculo em si (merge por anuncio_id, CTR, ordenação) é puro e vive em
// lib/stats/metricasAnunciosStats.ts — testado isoladamente lá.

import { useState, useEffect, useCallback } from 'react'
import {
  listarAnunciosParaMetricas,
  buscarMetricasDiarias,
} from '@/lib/services/adminAnunciosMetricas.service'
import { combinarAnunciosComMetricas, type AnuncioComMetricas } from '@/lib/stats/metricasAnunciosStats'

export type { AnuncioComMetricas }

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
