//lib/services/avaliacao.service.ts

import { supabase } from '@/lib/supabase'
import type { AvaliacaoRaw, AvaliacaoInsertPayload } from '@/types/avaliacao'

export async function fetchProjetoPorToken(token: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(`
      *,
      portfolio_fotos(*),
      prestadores(id, nome, slug, foto_perfil, whatsapp, garantia_dias, categoria:categorias(nome)),
      avaliacoes_clientes(id, nota, motivos, created_at)
    `)
    .eq('avaliacao_token', token)
    .maybeSingle()                  // ← era .single(); nunca lança PGRST116

  if (error) throw error            // só lança erros reais (rede, permissão…)
  return data                       // null quando não encontrado, objeto quando encontrado
}

export type ResultadoReivindicacao =
  | 'vinculado'
  | 'ja_vinculado'
  | 'vinculado_outra_conta'
  | 'prestador_dono'
  | 'nao_encontrado'
  | 'nao_autenticado'

const RESULTADOS_VALIDOS: ResultadoReivindicacao[] = [
  'vinculado', 'ja_vinculado', 'vinculado_outra_conta',
  'prestador_dono', 'nao_encontrado', 'nao_autenticado',
]

/**
 * Reivindica o projeto pelo token: a primeira conta logada que abre o link
 * passa a ser a dona do vínculo (`cliente_user_id`). A regra vive na função
 * `reivindicar_projeto_por_token` do banco (atômica; nunca sobrescreve um
 * vínculo existente e não deixa o próprio prestador virar cliente).
 *
 * Não-bloqueante por desenho: se a função ainda não existir no banco (migration
 * não aplicada) ou a chamada falhar, devolve null e quem chama usa o caminho
 * antigo por WhatsApp (`reivindicarProjetoPorWhatsapp`).
 */
export async function reivindicarProjetoPorToken(token: string): Promise<ResultadoReivindicacao | null> {
  const { data, error } = await supabase.rpc('reivindicar_projeto_por_token', { p_token: token })

  if (error) {
    console.error('Erro ao reivindicar projeto pelo token:', error.message)
    return null
  }

  return RESULTADOS_VALIDOS.includes(data as ResultadoReivindicacao) ? (data as ResultadoReivindicacao) : null
}

/**
 * Caminho antigo (fallback): vincula pelo WhatsApp do `profiles` quando ele bate
 * com o do projeto. Só roda quando `reivindicarProjetoPorToken` devolve null
 * (função ainda não aplicada no banco ou falha), para não regredir quem já era
 * vinculado assim. Nunca sobrescreve um vínculo existente. Pode ser removido
 * depois que a migration 20261103230000 estiver em produção.
 */
export async function reivindicarProjetoPorWhatsapp(projetoId: string, userId: string) {
  const { data: perfil } = await supabase
    .from('profiles')
    .select('whatsapp')
    .eq('id', userId)
    .maybeSingle()

  if (!perfil?.whatsapp) return

  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ cliente_user_id: userId })
    .eq('id', projetoId)
    .eq('cliente_whatsapp', perfil.whatsapp)
    .is('cliente_user_id', null)

  if (error) console.error('Erro ao reivindicar projeto por WhatsApp:', error.message)
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

export async function fetchAvaliacaoClientePorProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('avaliacoes_clientes')
    .select('id, nota, motivos, created_at')
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

export type ResultadoAvaliacao =
  | 'avaliado'
  | 'nao_autenticado'
  | 'nao_encontrado'
  | 'sem_vinculo'
  | 'nao_e_dono'
  | 'projeto_nao_concluido'
  | 'ja_avaliado'
  | 'nota_invalida'

const RESULTADOS_AVALIACAO: ResultadoAvaliacao[] = [
  'avaliado', 'nao_autenticado', 'nao_encontrado', 'sem_vinculo',
  'nao_e_dono', 'projeto_nao_concluido', 'ja_avaliado', 'nota_invalida',
]

/**
 * Avalia o projeto como cliente. Somente a conta DONA do projeto
 * (`portfolio_projetos.cliente_user_id`) consegue: a regra vive na função
 * `avaliar_projeto` do banco, que também grava a avaliação e finaliza o projeto
 * de forma atômica. Devolve o código do resultado; só lança em erro de rede/banco.
 */
export async function avaliarProjeto(params: {
  projetoId: string
  nota: number
  comentario: string
  indica: boolean
}): Promise<ResultadoAvaliacao> {
  const { data, error } = await supabase.rpc('avaliar_projeto', {
    p_projeto_id: params.projetoId,
    p_nota: params.nota,
    p_comentario: params.comentario,
    p_indica: params.indica,
  })

  if (error) throw error

  if (!RESULTADOS_AVALIACAO.includes(data as ResultadoAvaliacao)) {
    throw new Error(`Resposta inesperada de avaliar_projeto: ${String(data)}`)
  }
  return data as ResultadoAvaliacao
}

/** @deprecated Escrita direta bloqueada pelo banco após 20261104190100; use `avaliarProjeto`. */
export async function inserirAvaliacao(payload: AvaliacaoInsertPayload) {
  const { error } = await supabase.from('avaliacoes').insert(payload)
  if (error) throw error
}

/** @deprecated Update direto de status bloqueado para clientes após 20261104190100; use `avaliarProjeto`. */
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
