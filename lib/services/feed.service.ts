// lib/services/feed.service.ts — acesso ao banco do feed (a regra fica nas funções do banco).
import { supabase } from '@/lib/supabase'
import { ITENS_POR_PAGINA, normalizarFeed, type FeedItem } from '@/lib/feed/feed'

export interface FiltroFeed {
  categoriaId?: string | null
  somenteSeguidos?: boolean
  pagina?: number
}

export async function fetchFeed({ categoriaId = null, somenteSeguidos = false, pagina = 0 }: FiltroFeed = {}): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('feed_projetos', {
    p_categoria_id: categoriaId,
    p_cidade_id: null,
    p_somente_seguidos: somenteSeguidos,
    p_limite: ITENS_POR_PAGINA,
    p_pagina: pagina,
  })
  if (error) throw error
  return normalizarFeed(data)
}

export async function alternarCurtida(projetoId: string): Promise<{ curtido?: boolean; total?: number; erro?: string }> {
  const { data, error } = await supabase.rpc('alternar_curtida', { p_projeto_id: projetoId })
  if (error) throw error
  return (data ?? {}) as { curtido?: boolean; total?: number; erro?: string }
}

export async function seguirPrestador(prestadorId: number): Promise<string> {
  const { data, error } = await supabase.rpc('seguir_prestador', { p_prestador_id: prestadorId })
  if (error) throw error
  return String(data)
}

export async function deixarDeSeguirPrestador(prestadorId: number): Promise<string> {
  const { data, error } = await supabase.rpc('deixar_de_seguir', { p_prestador_id: prestadorId })
  if (error) throw error
  return String(data)
}

export interface CategoriaDoFiltro { id: string; nome: string }

export async function fetchCategoriasDoFiltro(): Promise<CategoriaDoFiltro[]> {
  const { data, error } = await supabase.from('categorias').select('id, nome').order('nome')
  if (error) throw error
  return (data ?? []) as CategoriaDoFiltro[]
}
