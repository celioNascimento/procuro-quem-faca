'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AvaliacaoClienteRecebida {
  id: string
  nota: number
  motivos: string[]
  created_at: string
}

interface StatsAvaliacoesCliente {
  total: number
  media: number
  totalRecomenda: number
  distribuicao: Record<number, number>
}

const TAG_RECOMENDA = 'Recomendaria este cliente'

function calcularStats(avaliacoes: AvaliacaoClienteRecebida[]): StatsAvaliacoesCliente {
  const total = avaliacoes.length
  const somaNotas = avaliacoes.reduce((soma, item) => soma + item.nota, 0)
  const totalRecomenda = avaliacoes.filter((item) => item.motivos?.includes(TAG_RECOMENDA)).length
  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  avaliacoes.forEach((item) => {
    distribuicao[item.nota] = (distribuicao[item.nota] ?? 0) + 1
  })

  return {
    total,
    media: total ? somaNotas / total : 0,
    totalRecomenda,
    distribuicao,
  }
}

export function useAvaliacoesRecebidasCliente(clienteUserId: string | null) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoClienteRecebida[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true

    if (!clienteUserId) {
      setLoading(false)
      return
    }

    setLoading(true)

    // A RLS ("Cliente ve avaliacao recebida (double-blind)") já filtra
    // sozinha: só retornam linhas onde o cliente avaliou de volta o
    // prestador, ou onde já passaram 14 dias. Nenhum filtro adicional
    // é necessário aqui — o que a query devolve já é "revelado".
    supabase
      .from('avaliacoes_clientes')
      .select('id, nota, motivos, created_at')
      .eq('cliente_user_id', clienteUserId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!ativo) return
        if (error) {
          console.error('[v0] Falha ao buscar avaliações recebidas:', error)
        }
        setAvaliacoes(data ?? [])
        setLoading(false)
      })

    return () => {
      ativo = false
    }
  }, [clienteUserId])

  const stats = calcularStats(avaliacoes)

  return { avaliacoes, stats, loading }
}
