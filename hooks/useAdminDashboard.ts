//hooks/useAdminDashboard.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getContadoresGerais,
  getOrigemEAtivacaoStats,
  getRankingCategorias,
  getRadarRecente,
  subscribeLogsAtividades,
  type CategoriaRanking,
  type RadarItem,
} from '@/lib/services/adminDashboard.service'

export interface Stats {
  cidades: number
  anuncios: number
  prestadores: number
  logs: number
  curadoria: number
  registrados: number
  reivindicados: number
  topCategorias: CategoriaRanking[]
  ativacao: { total: number; enviados: number; ativos: number }
}

const STATS_INICIAL: Stats = {
  cidades: 0, anuncios: 0, prestadores: 0, logs: 0,
  curadoria: 0, registrados: 0, reivindicados: 0, topCategorias: [],
  ativacao: { total: 0, enviados: 0, ativos: 0 },
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<Stats>(STATS_INICIAL)
  const [radar, setRadar] = useState<RadarItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [notificacao, setNotificacao] = useState<string | null>(null)

  const hapticFeedback = useCallback((intensity: number | number[] = 10) => {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(intensity)
  }, [])

  const carregarDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) { setRefreshing(true); hapticFeedback(15) }
    try {
      const [contadores, { origem, ativacao }, topCategorias, radarRecente] = await Promise.all([
        getContadoresGerais(),
        getOrigemEAtivacaoStats(),
        getRankingCategorias(),
        getRadarRecente(),
      ])

      setStats({
        ...contadores,
        ...origem,
        topCategorias,
        ativacao,
      })
      setRadar(radarRecente)
    } catch (err) {
      console.error('Erro ao carregar dashboard admin:', err)
    } finally {
      setRefreshing(false)
    }
  }, [hapticFeedback])

  useEffect(() => {
    carregarDashboard()

    const canal = subscribeLogsAtividades((payload) => {
      if (payload.new.acao === 'DENUNCIA_PERFIL') {
        setNotificacao('Alerta de Segurança')
        hapticFeedback([50, 30, 50])
        setTimeout(() => setNotificacao(null), 4000)
      }
      carregarDashboard()
    })

    return () => { supabase.removeChannel(canal) }
  }, [carregarDashboard, hapticFeedback])

  const pctAtivacao = stats.ativacao.total
    ? Math.round((stats.ativacao.enviados / stats.ativacao.total) * 100)
    : 0

  return { stats, radar, refreshing, notificacao, pctAtivacao, carregarDashboard }
}