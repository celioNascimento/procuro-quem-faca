import { supabase } from '@/lib/supabase'
import type { Grupo, Categoria } from '@/types/categorias'

export async function fetchGrupos(): Promise<Grupo[]> {
  const { data, error } = await supabase
    .from('categorias_grupos')
    .select('id, nome, slug, icone, ordem, created_at')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, grupo_id, nome, slug, destaque, created_at')
    .order('nome', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchCategoriasPorGrupo(grupoId: string | number): Promise<Categoria[]> {
  if (!grupoId) return []
  const { data, error } = await supabase
    .from('categorias')
    .select('id, grupo_id, nome, slug, destaque, created_at')
    .eq('grupo_id', grupoId)
    .order('nome')
  if (error) throw error
  return data || []
}

export async function criarGrupo(payload: Pick<Grupo, 'nome' | 'slug'> & { icone?: string; ordem?: number }) {
  const { data, error } = await supabase
    .from('categorias_grupos')
    .insert([{ ...payload, icone: payload.icone || null, ordem: payload.ordem ?? 0 }])
    .select('id, nome, slug, icone, ordem, created_at')
    .single()
  if (error) throw error
  return data
}

export async function criarCategoria(payload: Pick<Categoria, 'nome' | 'slug' | 'grupo_id'> & { destaque?: boolean }) {
  const { data, error } = await supabase
    .from('categorias')
    .insert([{ ...payload, destaque: payload.destaque ?? false }])
    .select('id, grupo_id, nome, slug, destaque, created_at')
    .single()
  if (error) throw error
  return data
}

export async function fetchHabilidades() {
  const { data, error } = await supabase.from('habilidades').select('nome, categoria').order('nome')
  if (error) throw error
  return data || []
}
