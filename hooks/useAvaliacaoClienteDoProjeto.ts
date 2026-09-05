//hooks/useAvaliacaoClienteDoProjeto.ts

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AvaliacaoCliente {
  id: string
  nota: number
  motivos: string[]
}

export function useAvaliacaoClienteDoProjeto(projetoId: string | null) {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoCliente | null>(null)
  const [loading, setLoading] = useState(true)

  const buscar = async () => {
    if (!projetoId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('avaliacoes_clientes')
      .select('id, nota, motivos')
      .eq('projeto_id', projetoId)
      .maybeSingle()

    if (error) {
      console.error('[v0] Falha ao buscar avaliação do cliente:', error)
    }
    setAvaliacao(data ?? null)
    setLoading(false)
  }

  useEffect(() => {
    let ativo = true
    if (!projetoId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('avaliacoes_clientes')
      .select('id, nota, motivos')
      .eq('projeto_id', projetoId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!ativo) return
        if (error) {
          console.error('[v0] Falha ao buscar avaliação do cliente:', error)
        }
        setAvaliacao(data ?? null)
        setLoading(false)
      })
    return () => {
      ativo = false
    }
  }, [projetoId])

  return { avaliacao, loading, refetch: buscar }
}
