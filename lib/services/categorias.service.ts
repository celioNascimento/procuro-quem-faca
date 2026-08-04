//services/categorias.service.ts

import { supabase } from '@/lib/supabase'
import type { Grupo, Categoria, Habilidade } from '@/types/categorias'

export async function fetchGrupos(): Promise<Grupo[]> {
  const { data, error } = await supabase.from('categorias_grupos').select('*').order('nome')
  if (error) throw error
  return data || []
}

export async function fetchCategoriasPorGrupo(grupoId: string | number): Promise<Categoria[]> {
  if (!grupoId) return []
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('grupo_id', grupoId)
    .order('nome')
  if (error) throw error
  return data || []
}

export async function fetchHabilidades(): Promise<Habilidade[]> {
  const { data, error } = await supabase.from('habilidades').select('nome, categoria').order('nome')
  if (error) throw error
  return data || []
}