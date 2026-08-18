// hooks/useCasoGarantiaDoProjeto.ts
//
// Busca o caso de garantia ATIVO (ou o mais recente, se houver histórico)
// vinculado a um projeto. Usado dentro do UploadWizardContainer para decidir
// se a seção de garantia deve aparecer, e alimentar essa seção com os dados
// completos do caso (diferente do resumo trazido pelo join em
// usePortfolioDashboard, que só serve para o badge do ProjetoCard).

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface CasoGarantia {
  id: string
  projeto_id: string
  prestador_id: number
  cliente_user_id: string
  origem: 'cliente' | 'prestador'
  status:
    | 'aguardando_aceite_cliente'
    | 'aberta'
    | 'respondida'
    | 'sem_resposta'
    | 'resolvida'
    | 'recusada'
  descricao_problema: string
  resposta_prestador_garantia: string | null
  data_resposta: string | null
  resolucao_descricao: string | null
  data_resolucao: string | null
  prazo_resposta: string | null
  nota_resultante: number | null
  avaliacao_id: string | null
  created_at: string
}

const STATUS_ATIVOS = ['aguardando_aceite_cliente', 'aberta', 'respondida']

export function useCasoGarantiaDoProjeto(projetoId: string | null) {
  const [caso, setCaso] = useState<CasoGarantia | null>(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    if (!projetoId) {
      setCaso(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // Prioriza caso ativo; se não houver, pega o mais recente (histórico,
      // ex: já resolvido) para ainda assim mostrar o resultado ao prestador.
      const { data: ativo } = await supabase
        .from('solicitacoes_garantia')
        .select('*')
        .eq('projeto_id', projetoId)
        .in('status', STATUS_ATIVOS)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ativo) {
        setCaso(ativo as CasoGarantia)
        return
      }

      const { data: recente } = await supabase
        .from('solicitacoes_garantia')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setCaso((recente as CasoGarantia) ?? null)
    } catch (err) {
      console.error('Erro ao buscar caso de garantia do projeto:', err)
      setCaso(null)
    } finally {
      setLoading(false)
    }
  }, [projetoId])

  useEffect(() => { carregar() }, [carregar])

  const isAtivo = !!caso && STATUS_ATIVOS.includes(caso.status)

  return { caso, loading, isAtivo, recarregar: carregar }
}
