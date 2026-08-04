//hooks/useCategorias.ts

import { useState, useCallback } from 'react'
import { fetchGrupos, fetchCategoriasPorGrupo, fetchHabilidades } from '@/lib/services/categorias.service'
import type { Grupo, Categoria, Habilidade } from '@/types/categorias'

export function useCategorias() {
  const [listaGrupos, setListaGrupos] = useState<Grupo[]>([])
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([])
  const [todasHabilidades, setTodasHabilidades] = useState<Habilidade[]>([])

  const carregarGrupos = useCallback(async () => {
   const data = await fetchGrupos()
   setListaGrupos(data)
  }, [])

  const carregarCategorias = useCallback(async (grupoId: string | number) => {
    const data = await fetchCategoriasPorGrupo(grupoId)
    setListaCategorias(data)
  }, [])

  const carregarHabilidades = useCallback(async () => {
    const data = await fetchHabilidades()
    setTodasHabilidades(data)
  }, [])

  return {
    listaGrupos,
    listaCategorias,
    todasHabilidades,
    carregarGrupos,
    carregarCategorias,
    carregarHabilidades,
  }
}