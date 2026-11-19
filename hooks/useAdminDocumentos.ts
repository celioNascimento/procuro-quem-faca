// hooks/useAdminDocumentos.ts — fila de conferência de seguro e CND (equipe).
'use client'

import { useCallback, useEffect, useState } from 'react'
import { decidirDocumento, fetchFilaDocumentos, linkDoComprovante, type DocumentoAdmin } from '@/lib/services/documentosVerificacao.service'
import { insertLog } from '@/lib/db/logs'

export type FiltroDocumentos = 'pendentes' | 'aprovadas' | 'rejeitadas'

export interface CamposDecisao { motivo: string; validoAte: string; emissao: string }
const VAZIO: CamposDecisao = { motivo: '', validoAte: '', emissao: '' }

export function useAdminDocumentos() {
  const [itens, setItens] = useState<DocumentoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroDocumentos>('pendentes')
  const [processando, setProcessando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [campos, setCampos] = useState<Record<string, CamposDecisao>>({})

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      setItens(await fetchFilaDocumentos(filtro))
      setErro(null)
    } catch (e) {
      console.error('Erro ao carregar a fila de seguro/CND:', e)
      setErro('Não foi possível carregar a fila agora. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { queueMicrotask(() => carregar()) }, [carregar])

  const camposDe = (id: string) => campos[id] ?? VAZIO
  const atualizar = useCallback((id: string, parcial: Partial<CamposDecisao>) => {
    setCampos((antes) => ({ ...antes, [id]: { ...(antes[id] ?? VAZIO), ...parcial } }))
  }, [])

  const abrirComprovante = useCallback(async (item: DocumentoAdmin) => {
    const caminho = (item.dados?.pedido as { arquivo?: string } | undefined)?.arquivo
    if (!caminho) return
    try {
      window.open(await linkDoComprovante(caminho), '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.error('Erro ao abrir o comprovante:', e)
      setErro('Não foi possível abrir o comprovante.')
    }
  }, [])

  const decidir = useCallback(async (item: DocumentoAdmin, decisao: 'aprovada' | 'rejeitada') => {
    setProcessando(item.verificacao_id)
    setErro(null)
    const c = camposDe(item.verificacao_id)
    try {
      await decidirDocumento(item.verificacao_id, decisao, { motivo: c.motivo, validoAte: c.validoAte, emissao: c.emissao })
      await insertLog({
        acao: decisao === 'aprovada' ? 'VERIFICACAO_DOCUMENTO_APROVADA' : 'VERIFICACAO_DOCUMENTO_REJEITADA',
        entidadeTipo: 'prestador',
        entidadeId: String(item.prestador_id),
        detalhes: { verificacao_id: item.verificacao_id, tipo: item.tipo, motivo: c.motivo.trim() || null },
      }).catch((e) => console.error('Decisão salva, mas o log falhou:', e))
      await carregar()
    } catch (e) {
      console.error('Erro ao decidir o documento:', e)
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível salvar a decisão.')
    } finally {
      setProcessando(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campos, carregar])

  return { itens, loading, filtro, setFiltro, processando, erro, camposDe, atualizar, abrirComprovante, decidir }
}
