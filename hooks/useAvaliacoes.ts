import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  indica: boolean
  resposta_prestador: string | null
  cliente_id: string | null
  portfolio_projetos: { titulo: string } | null  // normalizado de array → objeto | null
}

// Formato bruto que o Supabase retorna para relações (sempre array)
interface AvaliacaoRaw extends Omit<Avaliacao, 'portfolio_projetos'> {
  portfolio_projetos: { titulo: string }[] | null
}

function normalizar(raw: AvaliacaoRaw): Avaliacao {
  return {
    ...raw,
    portfolio_projetos: raw.portfolio_projetos?.[0] ?? null,
  }
}

export interface AvaliacoesStats {
  media: number
  total: number
  totalIndica: number
  distribuicao: Record<number, number> // nota 1-5 → quantidade
}

interface UseAvaliacoesReturn {
  avaliacoes: Avaliacao[]
  stats: AvaliacoesStats
  loading: boolean
  error: string | null
  refetch: () => void
}

function calcularStats(avaliacoes: Avaliacao[]): AvaliacoesStats {
  if (avaliacoes.length === 0) {
    return { media: 0, total: 0, totalIndica: 0, distribuicao: {} }
  }

  const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0)
  const distribuicao = avaliacoes.reduce<Record<number, number>>((acc, av) => {
    acc[av.nota] = (acc[av.nota] ?? 0) + 1
    return acc
  }, {})

  return {
    media: parseFloat((soma / avaliacoes.length).toFixed(1)),
    total: avaliacoes.length,
    totalIndica: avaliacoes.filter((av) => av.indica).length,
    distribuicao,
  }
}

export function useAvaliacoes(prestadorId: number): UseAvaliacoesReturn {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!prestadorId) return

    let cancelled = false

    async function buscar() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('avaliacoes')
        .select(`
          id,
          nota,
          comentario,
          created_at,
          indica,
          resposta_prestador,
          cliente_id,
          portfolio_projetos(titulo)
        `)
        .eq('prestador_id', prestadorId)
        .eq('visivel', true)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (err) {
        setError('Não foi possível carregar as avaliações.')
        setLoading(false)
        return
      }

      setAvaliacoes((data as AvaliacaoRaw[]).map(normalizar))
      setLoading(false)
    }

    buscar()
    return () => { cancelled = true }
  }, [prestadorId, tick])

  return {
    avaliacoes,
    stats: calcularStats(avaliacoes),
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  }
}