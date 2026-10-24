// hooks/useAnuncioClienteFormDados.ts
//
// Dados de apoio usados pelo AnuncioClienteForm (components/admin/anuncios/):
// a lista de cidades ativas para o select, e a "categoria curinga" exigida
// pela chave estrangeira NOT NULL de anuncios_segmentacoes.categoria_id.

import { useState, useEffect } from 'react'
import {
  listarCidadesAtivasComRegiao,
  buscarCategoriaCuringa,
  type CidadeComRegiao,
  type CategoriaCuringa,
} from '@/lib/services/adminAnuncios.service'

export function useAnuncioClienteFormDados() {
  const [cidades, setCidades] = useState<CidadeComRegiao[]>([])
  const [categoriaCuringa, setCategoriaCuringa] = useState<CategoriaCuringa | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [cid, cat] = await Promise.all([listarCidadesAtivasComRegiao(), buscarCategoriaCuringa()])
        setCidades(cid)
        setCategoriaCuringa(cat)
      } catch (e: unknown) {
        console.error('[useAnuncioClienteFormDados] erro ao carregar dados base', e)
      }
    }
    carregar()
  }, [])

  return { cidades, categoriaCuringa }
}
