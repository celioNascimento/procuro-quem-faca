import { useState, useEffect } from 'react'
import { fetchAvaliacoesPorPrestador } from '@/lib/services/avaliacao.service'
import { normalizar, calcularStats } from '@/lib/utils/avaliacao.utils'
import type { Avaliacao, AvaliacoesStats } from '@/types/avaliacao'

interface UseAvaliacoesReturn {
  avaliacoes: Avaliacao[]
  stats: AvaliacoesStats
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAvaliacoes(prestadorId: number): UseAvaliacoesReturn {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [tick, setTick]             = useState(0)

  useEffect(() => {
    if (!prestadorId) return
    let cancelado = false

    async function buscar() {
      setLoading(true)
      setError(null)

      const raw = await fetchAvaliacoesPorPrestador(prestadorId)

      if (cancelado) return
      setAvaliacoes(raw.map(normalizar))
      setLoading(false)
    }

    buscar().catch(() => {
      if (!cancelado) {
        setError('Não foi possível carregar as avaliações.')
        setLoading(false)
      }
    })

    return () => { cancelado = true }
  }, [prestadorId, tick])

  return {
    avaliacoes,
    stats: calcularStats(avaliacoes),
    loading,
    error,
    refetch: () => setTick(t => t + 1),
  }
}