// lib/services/feed.service.ts — acesso ao banco do feed (a regra fica nas funções do banco).
import { supabase } from '@/lib/supabase'
import { ITENS_POR_PAGINA, normalizarFeed, type FeedItem } from '@/lib/feed/feed'
import { normalizarCidadesDoFeed, type CidadeDoFeed } from '@/lib/feed/filtros'
import { normalizarPerfilSocial, type PerfilSocial } from '@/lib/feed/perfilSocial'

export interface FiltroFeed {
  categoriaId?: string | null
  cidadeId?: string | null
  estado?: string | null
  somenteSeguidos?: boolean
  somenteSalvos?: boolean
  pagina?: number
}

export async function fetchFeed({ categoriaId = null, cidadeId = null, estado = null, somenteSeguidos = false, somenteSalvos = false, pagina = 0 }: FiltroFeed = {}): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('feed_projetos', {
    p_categoria_id: categoriaId,
    p_cidade_id: cidadeId,
    p_estado: estado,
    p_somente_seguidos: somenteSeguidos,
    p_somente_salvos: somenteSalvos,
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

/** Salvar/remover dos salvos (só o próprio usuário vê). Devolve {salvo} ou {erro}. */
export async function alternarSalvo(projetoId: string): Promise<{ salvo?: boolean; erro?: string }> {
  const { data, error } = await supabase.rpc('alternar_salvo', { p_projeto_id: projetoId })
  if (error) throw error
  return (data ?? {}) as { salvo?: boolean; erro?: string }
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

/** Prestador dono mostra ou oculta o trabalho no feed (não apaga nada). Devolve o código do banco ('ok', 'nao_e_dono'...). */
export async function ocultarProjetoNoFeed(projetoId: string, ocultar: boolean): Promise<string> {
  const { data, error } = await supabase.rpc('feed_ocultar_projeto', { p_projeto_id: projetoId, p_ocultar: ocultar })
  if (error) throw error
  return String(data)
}

/** Curtir/seguir do perfil público: totais para todos; "seguindo" e "curtido" só para quem está logado. null = sem curtir/seguir. */
export async function fetchPerfilSocial(prestadorId: number): Promise<PerfilSocial | null> {
  const { data, error } = await supabase.rpc('perfil_social', { p_prestador_id: prestadorId })
  if (error) throw error
  return normalizarPerfilSocial(data)
}

/** Só as cidades que têm trabalho aparecendo no feed (para o filtro nunca dar tela vazia). */
export async function fetchCidadesDoFeed(): Promise<CidadeDoFeed[]> {
  const { data, error } = await supabase.rpc('feed_cidades')
  if (error) throw error
  return normalizarCidadesDoFeed(data)
}

export interface CategoriaDoFiltro { id: string; nome: string }

export async function fetchCategoriasDoFiltro(): Promise<CategoriaDoFiltro[]> {
  const { data, error } = await supabase.from('categorias').select('id, nome').order('nome')
  if (error) throw error
  return (data ?? []) as CategoriaDoFiltro[]
}
