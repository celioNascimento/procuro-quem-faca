// hooks/useAvaliacaoDoProjeto.ts
//
// Busca a avaliação de um projeto finalizado — usada pelo WizardCompleted
// para mostrar o feedback real do cliente (comentário + indicação) no
// lugar de um resumo genérico, especialmente relevante no fluxo sem_fotos
// onde não há nenhum outro conteúdo do cliente para exibir.

'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AvaliacaoResumo {
  id: string
  comentario: string | null
  indica: boolean | null
}

export function useAvaliacaoDoProjeto(projetoId: string | null) {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoResumo | null>(null)
  const [loading,    setLoading]  = useState(true)

  const carregar = useCallback(async () => {
    if (!projetoId) { setLoading(false); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('avaliacoes')
        .select('id, comentario, indica')
        .eq('projeto_id', projetoId)
        .maybeSingle()
      setAvaliacao(data ?? null)
    } catch {
      setAvaliacao(null)
    } finally {
      setLoading(false)
    }
  }, [projetoId])

  useEffect(() => { carregar() }, [carregar])

  return { avaliacao, loading, recarregar: carregar }
}
