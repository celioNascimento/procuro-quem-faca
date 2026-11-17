// hooks/useAdminVerificacoes.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { decidirVerificacao, fetchFilaVerificacoes } from '@/lib/services/adminVerificacoes.service'
import { insertLog } from '@/lib/db/logs'
import type { FiltroVerificacoes, VerificacaoCnpjAdmin } from '@/types/verificacoesAdmin'

export function useAdminVerificacoes() {
  const [itens, setItens] = useState<VerificacaoCnpjAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroVerificacoes>('pendentes')
  const [processando, setProcessando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [motivos, setMotivos] = useState<Record<string, string>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      setItens(await fetchFilaVerificacoes(filtro))
      setErro(null)
    } catch (err) {
      console.error('Erro ao carregar a fila de CNPJ:', err)
      setErro('Não foi possível carregar a fila agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => {
    queueMicrotask(() => carregar())
  }, [carregar])

  const atualizarMotivo = useCallback((id: string, valor: string) => {
    setMotivos(prev => ({ ...prev, [id]: valor }))
  }, [])

  const decidir = useCallback(async (item: VerificacaoCnpjAdmin, decisao: 'aprovada' | 'rejeitada') => {
    setProcessando(item.verificacao_id)
    setErro(null)
    try {
      const motivo = motivos[item.verificacao_id]
      await decidirVerificacao(item.verificacao_id, decisao, motivo)
      // O log é auxiliar: se falhar, a decisão já foi gravada e não deve parecer erro.
      await insertLog({
        acao: decisao === 'aprovada' ? 'VERIFICACAO_CNPJ_APROVADA' : 'VERIFICACAO_CNPJ_REJEITADA',
        entidadeTipo: 'prestador',
        entidadeId: String(item.prestador_id),
        detalhes: { verificacao_id: item.verificacao_id, motivo: motivo?.trim() || null },
      }).catch(err => console.error('Decisão salva, mas o log falhou:', err))
      await carregar()
    } catch (err) {
      console.error('Erro ao decidir a verificação:', err)
      setErro('Não foi possível salvar a decisão. Atualize a lista e confira o estado.')
    } finally {
      setProcessando(null)
    }
  }, [motivos, carregar])

  return { itens, loading, filtro, setFiltro, processando, erro, motivos, atualizarMotivo, decidir }
}
