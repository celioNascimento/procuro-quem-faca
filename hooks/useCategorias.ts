import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Grupo, Categoria, Habilidade } from '@/types/categorias'

export function useCategorias() {
  const [listaGrupos, setListaGrupos] = useState<Grupo[]>([])
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([])
  const [todasHabilidades, setTodasHabilidades] = useState<Habilidade[]>([])

  const carregarGrupos = useCallback(async () => {
    const { data } = await supabase.from('categorias_grupos').select('*').order('nome')
    setListaGrupos(data || [])
  }, [])

  const carregarCategorias = useCallback(async (grupoId: string | number) => {
    if (!grupoId) { setListaCategorias([]); return }
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .eq('grupo_id', grupoId)
      .order('nome')
    setListaCategorias(data || [])
  }, [])

  const carregarHabilidades = useCallback(async () => {
    const { data } = await supabase.from('habilidades').select('nome, categoria').order('nome')
    setTodasHabilidades(data || [])
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