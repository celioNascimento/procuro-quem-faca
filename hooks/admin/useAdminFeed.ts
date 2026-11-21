'use client'

import { useCallback, useEffect, useState } from 'react'
import { carregarResumoFeed, devolverAoFeed, removerDoFeed } from '@/lib/services/adminFeed.service'
import { mensagemDoResultado, type ResumoFeedAdmin } from '@/lib/feed/adminFeed'

const VAZIO: ResumoFeedAdmin = { itens: [], porDia: [] }

export function useAdminFeed() {
  const [resumo, setResumo] = useState<ResumoFeedAdmin>(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      setResumo(await carregarResumoFeed())
      setErro(null)
    } catch (e) {
      console.error('[admin/feed] erro ao carregar', e)
      setErro('Não foi possível carregar o feed. Tente de novo.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { queueMicrotask(() => void carregar()) }, [carregar])

  async function executar(projetoId: string, acao: () => Promise<string>): Promise<boolean> {
    setProcessandoId(projetoId)
    setErro(null)
    try {
      const mensagem = mensagemDoResultado(await acao())
      if (mensagem) { setErro(mensagem); return false }
      await carregar()
      return true
    } catch (e) {
      console.error('[admin/feed] erro na ação', e)
      setErro('Não foi possível concluir. Tente de novo.')
      return false
    } finally {
      setProcessandoId(null)
    }
  }

  const remover = (projetoId: string, motivo: string) => executar(projetoId, () => removerDoFeed(projetoId, motivo.trim()))
  const devolver = (projetoId: string) => executar(projetoId, () => devolverAoFeed(projetoId))

  return { resumo, carregando, processandoId, erro, remover, devolver, recarregar: carregar }
}
