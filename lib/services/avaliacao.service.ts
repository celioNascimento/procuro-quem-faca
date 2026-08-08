//lib/services/avaliacao.service.ts

import { supabase } from '@/lib/supabase'
import type { AvaliacaoRaw, AvaliacaoInsertPayload } from '@/types/avaliacao'

export async function fetchProjetoPorToken(token: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      *,
      portfolio_fotos(*),
      prestadores(nome, slug, foto_perfil, whatsapp, categoria:categorias(nome))
    `)
    .eq('avaliacao_token', token)
    .maybeSingle()                  // ← era .single(); nunca lança PGRST116

  if (error) throw error            // só lança erros reais (rede, permissão…)
  return data                       // null quando não encontrado, objeto quando encontrado
}

export async function fetchAvaliacaoPorProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('projeto_id', projetoId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchComentariosPorProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('portfolio_comentarios')
    .select('*')
    .eq('projeto_id', projetoId)
    .order('criado_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function inserirComentario(payload: {
  foto_id: string
  projeto_id: string
  autor_tipo: 'cliente' | 'prestador'
  texto: string
}) {
  const { data, error } = await supabase
    .from('portfolio_comentarios')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function inserirAvaliacao(payload: AvaliacaoInsertPayload) {
  const { error } = await supabase.from('avaliacoes').insert(payload)
  if (error) throw error
}

export async function finalizarProjeto(projetoId: string) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({
      status: 'finalizado',
      data_conclusao: new Date().toISOString().split('T')[0],
    })
    .eq('id', projetoId)

  if (error) throw error
}

export async function fetchAvaliacoesPorPrestador(prestadorId: number): Promise<AvaliacaoRaw[]> {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
      id,
      nota,
      comentario,
      created_at,
      status,
      indica,
      resposta_prestador,
      cliente_id,
      portfolio_projetos(titulo)
    `)
    .eq('prestador_id', prestadorId)
    .eq('visivel', true)
    .eq('em_disputa', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar avaliações:', error.message)
    return []
  }

  return data ?? []
}

export async function marcarProjetoEmDisputa(projetoId: string) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ status: 'em_disputa' })
    .eq('id', projetoId)
  if (error) throw error
}
