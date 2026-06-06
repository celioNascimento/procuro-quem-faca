import { supabase } from '@/lib/supabase'

export async function fetchProjetoComToken(id: string, token: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      *,
      portfolio_fotos(*),
      prestadores(nome, foto_perfil, whatsapp, categoria:categorias(nome))
    `)
    .eq('id', id)
    .eq('avaliacao_token', token)
    .single()

  if (error) throw error
  return data
}

export async function fetchAvaliacaoPorProjeto(projetoId: string) {
  const { data } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('projeto_id', projetoId)
    .maybeSingle()
  return data
}

export async function fetchComentariosPorProjeto(projetoId: string) {
  const { data } = await supabase
    .from('portfolio_comentarios')
    .select('*')
    .eq('projeto_id', projetoId)
    .order('criado_at', { ascending: true })
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

export async function inserirAvaliacao(payload: {
  projeto_id: string
  prestador_id: string
  nota: number
  comentario: string
  indica: boolean
  visivel: boolean
  status: string
}) {
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