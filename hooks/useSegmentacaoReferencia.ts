//hooks/useSegmentacaoReferencia.ts

import { useState, useEffect, useCallback } from 'react'
import {
  listarEstados,
  listarRegioesPorEstado,
  listarCidadesPorRegiao,
  listarGrupos,
  listarCategoriasPorGrupo,
} from '@/lib/services/adminAnuncios.service'

type Opcao = { id?: string; sigla?: string; nome: string }

/**
 * Responsabilidade única: expõe os dados de referência para os selects em
 * cascata (Estado → Região → Cidade, Grupo → Categoria) usados no
 * formulário de segmentação. Não sabe nada sobre o anúncio em si.
 */
export function useSegmentacaoReferencia() {
  const [estados, setEstados] = useState<Opcao[]>([])
  const [grupos, setGrupos] = useState<Opcao[]>([])
  const [loadingBase, setLoadingBase] = useState(true)

  useEffect(() => {
    Promise.all([listarEstados(), listarGrupos()])
      .then(([e, g]) => {
        setEstados(e)
        setGrupos(g)
      })
      .finally(() => setLoadingBase(false))
  }, [])

  const buscarRegioes = useCallback(async (estadoSigla: string) => {
    if (!estadoSigla) return []
    return listarRegioesPorEstado(estadoSigla)
  }, [])

  const buscarCidades = useCallback(async (regiaoId: string) => {
    if (!regiaoId) return []
    return listarCidadesPorRegiao(regiaoId)
  }, [])

  const buscarCategorias = useCallback(async (grupoId: string) => {
    if (!grupoId) return []
    return listarCategoriasPorGrupo(grupoId)
  }, [])

  return { estados, grupos, loadingBase, buscarRegioes, buscarCidades, buscarCategorias }
}