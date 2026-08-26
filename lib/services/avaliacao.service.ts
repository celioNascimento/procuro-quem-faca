//lib/services/avaliacao.service.ts

import { supabase } from '@/lib/supabase'
import type { AvaliacaoRaw, AvaliacaoInsertPayload } from '@/types/avaliacao'

export async function fetchProjetoPorToken(token: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      *,
      portfolio_fotos(*),
      prestadores(id, nome, slug, foto_perfil, whatsapp, garantia_dias, categoria:categorias(nome))
    `)
    .eq('avaliacao_token', token)
    .maybeSingle()                  // ← era .single(); nunca lança PGRST116

  if (error) throw error            // só lança erros reais (rede, permissão…)
  return data                       // null quando não encontrado, objeto quando encontrado
}

/**
 * "Reivindica" um projeto para o usuário logado, preenchendo cliente_user_id
 * quando ainda está null e o whatsapp do projeto bate com o whatsapp do
 * profile do usuário. Idempotente — não faz nada se já houver vínculo
 * (mesmo que seja de outro usuário, para não sobrescrever silenciosamente).
 *
 * Chamado a partir de useAcompanhamento sempre que o projeto é carregado
 * pelo token, para que projetos antigos (criados antes do vínculo forte
 * existir) sejam gradualmente migrados conforme o cliente os acessa —
 * sem precisar de um backfill único cobrindo todos os casos de uma vez.
 */
export async function reivindicarProjetoParaCliente(projetoId: string, userId: string) {
  const { data: perfil } = await supabase
    .from('profiles')
    .select('whatsapp')
    .eq('id', userId)
    .maybeSingle()

  if (!perfil?.whatsapp) return

  // Só atualiza se cliente_user_id ainda for null — nunca sobrescreve um
  // vínculo já existente (mesmo que pareça "errado", isso seria uma
  // decisão manual/administrativa, não algo para essa função silenciosa).
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ cliente_user_id: userId })
    .eq('id', projetoId)
    .eq('cliente_whatsapp', perfil.whatsapp)
    .is('cliente_user_id', null)

  if (error) {
    // Não-bloqueante: se falhar (ex: RLS impedindo, ou corrida com outra
    // reivindicação), a página continua funcionando normalmente — só o
    // vínculo forte não é criado nesta visita.
    console.error('Erro ao reivindicar projeto para cliente:', error.message)
  }
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
      projeto_id,
      nota_efetiva,
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
