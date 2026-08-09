//hooks/useAdminLogs.ts

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchLogsRecentes, type LogAtividade } from '@/lib/services/adminLogs.service'
import { subscribeLogsAtividades } from '@/lib/db/logs'
import { supabase } from '@/lib/supabase'

export function useAdminLogs() {
  const [logs, setLogs] = useState<LogAtividade[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [busca, setBusca] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [periodoGrafico, setPeriodoGrafico] = useState<'DIA' | 'MES'>('DIA')

  const carregarLogs = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const data = await fetchLogsRecentes(1000)
      setLogs(data)
    } catch (err) {
      console.error('Erro ao carregar logs:', err)
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 600)
    }
  }, [])

  useEffect(() => {
    carregarLogs()

    const canal = subscribeLogsAtividades('admin_logs_realtime', (payload) => {
      setLogs(prev => [payload.new, ...prev])
    })

    return () => { supabase.removeChannel(canal) }
  }, [carregarLogs])

  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      const matchesBusca = !busca ||
        log.usuario_email?.toLowerCase().includes(busca.toLowerCase()) ||
        JSON.stringify(log.detalhes).toLowerCase().includes(busca.toLowerCase())

      const matchesTipo = tipoFiltro === 'TODOS' || log.acao === tipoFiltro
      const matchesData = !dataInicio || log.created_at.startsWith(dataInicio)

      return matchesBusca && matchesTipo && matchesData
    })
  }, [logs, busca, tipoFiltro, dataInicio])

  const dadosGrafico = useMemo(() => {
    const grupos: Record<string, { name: string; total: number; buscas: number }> = {}
    logsFiltrados.slice(0, 500).forEach(log => {
      const data = new Date(log.created_at)
      const chave = periodoGrafico === 'DIA'
        ? data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : data.toLocaleDateString('pt-BR', { month: 'short' })

      if (!grupos[chave]) grupos[chave] = { name: chave, total: 0, buscas: 0 }
      grupos[chave].total++
      if (log.acao === 'BUSCA_SEM_SUCESSO') grupos[chave].buscas++
    })
    return Object.values(grupos).reverse()
  }, [logsFiltrados, periodoGrafico])

  const exportarCSV = useCallback(() => {
    if (logsFiltrados.length === 0) return

    const headers = ['Data', 'Hora', 'Evento', 'Usuario', 'Detalhes']
    const rows = logsFiltrados.map(log => [
      new Date(log.created_at).toLocaleDateString('pt-BR'),
      new Date(log.created_at).toLocaleTimeString('pt-BR'),
      log.acao,
      log.usuario_email || 'Anonimo',
      JSON.stringify(log.detalhes).replace(/"/g, "'"),
    ])

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `logs_auditoria_${Date.now()}.csv`)
    link.click()
  }, [logsFiltrados])

  const resetarFiltros = useCallback(() => {
    setBusca('')
    setDataInicio('')
    setTipoFiltro('TODOS')
  }, [])

  return {
    loading, refreshing, logsFiltrados, dadosGrafico,
    busca, setBusca, dataInicio, setDataInicio, tipoFiltro, setTipoFiltro,
    periodoGrafico, setPeriodoGrafico,
    carregarLogs, exportarCSV, resetarFiltros,
  }
}