// hooks/useAdminCliques.ts
//
// Resumo dos cliques no WhatsApp para /admin/cliques (rota /api/admin/cliques).

'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ContagemDia, ContagemOrigem, ResumoCliques } from '@/lib/tracking/resumo'

export type PeriodoCliques = 7 | 30 | 90

export interface ResumoAdminCliques extends Omit<ResumoCliques, 'porPrestador'> {
  porPrestador: { prestadorId: number; total: number; nome: string | null }[]
}

export interface RespostaAdminCliques {
  dias: PeriodoCliques
  truncado: boolean
  rastreio: { modo: 'amostra' | 'todos'; prestadoresNaAmostra: number }
  resumo: ResumoAdminCliques
}

export type { ContagemDia, ContagemOrigem }

export function useAdminCliques() {
  const [periodo, setPeriodo] = useState<PeriodoCliques>(30)
  const [dados, setDados] = useState<RespostaAdminCliques | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async (dias: PeriodoCliques) => {
    try {
      const resposta = await fetch(`/api/admin/cliques?dias=${dias}`, { cache: 'no-store' })
      if (!resposta.ok) throw new Error(`Falha ${resposta.status} ao carregar cliques`)
      setDados((await resposta.json()) as RespostaAdminCliques)
      setErro(null)
    } catch (error) {
      console.error('[useAdminCliques] Erro ao carregar cliques:', error)
      setErro('Não foi possível carregar os cliques.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => carregar(periodo))
  }, [periodo, carregar])

  const trocarPeriodo = useCallback((novo: PeriodoCliques) => {
    setCarregando(true)
    setPeriodo(novo)
  }, [])

  return { periodo, trocarPeriodo, dados, carregando, erro, recarregar: () => carregar(periodo) }
}
