// hooks/useAdminAtivacao.ts

import { useState, useEffect, useCallback } from 'react'
import {
  listarPrestadoresAtivacao,
  atualizarStatusAtivacao,
  salvarObservacaoAtivacao,
  type PrestadorAtivacao,
} from '@/lib/services/adminAtivacao.service'
import { contarPorStatus } from '@/lib/stats/ativacaoStats'

export function useAdminAtivacao() {
  const [prestadores, setPrestadores] = useState<PrestadorAtivacao[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<number | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listarPrestadoresAtivacao()
      setPrestadores(data)
      setStats(contarPorStatus(data))
    } catch (e: unknown) {
      console.error('[useAdminAtivacao] erro ao carregar', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => carregar())
  }, [carregar])

  const atualizarStatus = useCallback(
    async (id: number, novoStatus: string) => {
      setSalvando(id)
      try {
        const update = await atualizarStatusAtivacao(id, novoStatus)
        setPrestadores((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...update, ativacao_status: novoStatus } : p))
        )
        setStats((prev) => {
          const antigo = prestadores.find((p) => p.id === id)?.ativacao_status
          const novo = { ...prev }
          if (antigo) novo[antigo] = Math.max(0, (novo[antigo] || 1) - 1)
          novo[novoStatus] = (novo[novoStatus] || 0) + 1
          return novo
        })
      } catch (e: unknown) {
        console.error('[useAdminAtivacao] erro ao salvar status', e)
      } finally {
        setSalvando(null)
      }
    },
    [prestadores]
  )

  const salvarObs = useCallback(async (id: number, obs: string) => {
    await salvarObservacaoAtivacao(id, obs)
    setPrestadores((prev) => prev.map((p) => (p.id === id ? { ...p, ativacao_obs: obs } : p)))
  }, [])

  return { prestadores, loading, salvando, stats, atualizarStatus, salvarObs }
}
