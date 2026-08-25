// hooks/useCasoGarantiaDoProjeto.ts
//
// Busca o caso de garantia de um projeto — compartilhado entre
// GarantiaSecaoCliente, GarantiaSecaoWizard e page.tsx (via lifting).
//
// Inclui todos os status relevantes: ativos (em andamento) e finais
// (resolvida, sem_resposta, recusada) — para que o cliente e o prestador
// vejam o resultado mesmo após o encerramento do caso.

'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Ativos: caso ainda em andamento — usado para derivar temGarantiaAtiva
// nas telas de painel (CardPrestador, StatusMini, LinhaDeTempo).
export const STATUS_GARANTIA_ATIVOS = ['aguardando_aceite_cliente', 'aberta', 'respondida']

// Finais: caso encerrado — exibido para cliente e prestador como histórico.
const STATUS_GARANTIA_FINAIS = ['resolvida', 'sem_resposta', 'recusada']

// Todos os status que merecem ser carregados pelo hook.
const STATUS_TODOS = [...STATUS_GARANTIA_ATIVOS, ...STATUS_GARANTIA_FINAIS]

export interface CasoGarantia {
  id: string
  status: string
  origem: 'cliente' | 'prestador'
  descricao_problema: string
  fotos_problema: string[]
  resposta_prestador_garantia: string | null
  prazo_resposta: string | null
  data_resposta: string | null
  resolucao_descricao: string | null
  fotos_resolucao: string[]
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
        .in('status', STATUS_TODOS)
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

  // temGarantiaAtiva deriva do caso carregado — true só quando o status
  // é ativo (em andamento), não quando já foi encerrado. Usado pelos
  // componentes visuais (CardPrestador, StatusMini, LinhaDeTempo) para
  // decidir se exibem o badge laranja de "em andamento".
  const temGarantiaAtiva = caso !== null && STATUS_GARANTIA_ATIVOS.includes(caso.status)

  return { caso, loading, recarregar: carregar, temGarantiaAtiva }
}
