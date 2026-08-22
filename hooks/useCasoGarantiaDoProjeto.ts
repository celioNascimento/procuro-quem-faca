// hooks/useCasoGarantiaDoProjeto.ts
//
// Busca o caso de garantia ativo de um projeto — compartilhado entre
// GarantiaSecaoCliente e page.tsx (via lifting), para que a page saiba
// se há garantia ativa sem precisar de uma segunda query independente.

'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const STATUS_ATIVOS = ['aguardando_aceite_cliente', 'aberta', 'respondida']

export interface CasoGarantia {
  id: string
  status: string
  origem: 'cliente' | 'prestador'
  descricao_problema: string
  resposta_prestador_garantia: string | null
  prazo_resposta: string | null
  data_resposta: string | null
  data_resolucao: string | null
  nota_resultante: number | null
  avaliacao_id: string | null
  projeto_id: string
  prestador_id: number
  cliente_user_id: string
}

export function useCasoGarantiaDoProjeto(projetoId: string | null) {
  const [caso,    setCaso]    = useState<CasoGarantia | null>(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    if (!projetoId) { setLoading(false); return }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('solicitacoes_garantia')
        .select('*')
        .eq('projeto_id', projetoId)
        .in('status', STATUS_ATIVOS)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setCaso(data ?? null)
    } catch {
      setCaso(null)
    } finally {
      setLoading(false)
    }
  }, [projetoId])

  useEffect(() => { carregar() }, [carregar])

  return { caso, loading, recarregar: carregar }
}
