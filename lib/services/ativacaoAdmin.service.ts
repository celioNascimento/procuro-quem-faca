//lib/services/ativacaoAdmin.service.ts
//
// Lista e atualização do funil de ativação (tela /admin/ativacao). Os dados ficam na tabela
// `prestador_ativacao`, que só administradores leem: a tabela `prestadores` é pública.

import { supabase } from '@/lib/supabase'
import { buscarTodasAsLinhas } from '@/lib/supabase/paginar'
import { achatarPerfil, type AtivacaoEmbutida, type LocalEmbutido } from '@/lib/ativacao/lista'
import type { TrabalhosPorPrestador } from '@/lib/ativacao/funil'

const COLUNAS =
  'id, nome, whatsapp, slug, user_id, exemplo, estado_sigla, cidades(nome, estado_sigla), regioes(nome), categorias(nome), ' +
  'prestador_ativacao(status, enviado_em, respondeu_em, obs)'

interface LinhaDaLista extends LocalEmbutido {
  id: number
  nome: string | null
  whatsapp: string | null
  slug: string | null
  user_id: string | null
  exemplo: boolean | null
  prestador_ativacao: AtivacaoEmbutida | AtivacaoEmbutida[] | null
}

export async function listarPerfisParaAtivacao() {
  const linhas = await buscarTodasAsLinhas<LinhaDaLista>((de, ate) =>
    supabase
      .from('prestadores')
      .select(COLUNAS)
      .order('nome')
      .order('id') // desempate: sem ele a paginação poderia repetir ou pular perfis com o mesmo nome
      .range(de, ate) as unknown as PromiseLike<{ data: LinhaDaLista[] | null; error: unknown }>,
  )
  return linhas.map(achatarPerfil)
}

// Devolve só os campos alterados, já no formato plano usado pela tela
export async function salvarStatusAtivacao(prestadorId: number, status: string) {
  const agora = new Date().toISOString()
  const linha: Record<string, unknown> = { prestador_id: prestadorId, status, atualizado_em: agora }
  if (status === 'enviado') linha.enviado_em = agora
  if (status === 'respondeu_positivo') linha.respondeu_em = agora

  const { error } = await supabase.from('prestador_ativacao').upsert(linha)
  if (error) throw error

  const alterados: Record<string, string> = { ativacao_status: status }
  if (linha.enviado_em) alterados.ativacao_enviado_em = agora
  if (linha.respondeu_em) alterados.ativacao_respondeu_em = agora
  return alterados
}

export async function salvarObsAtivacao(prestadorId: number, obs: string) {
  const { error } = await supabase.from('prestador_ativacao').upsert({
    prestador_id: prestadorId,
    obs: obs.trim() || null,
    atualizado_em: new Date().toISOString(),
  })
  if (error) throw error
}

interface LinhaDeTrabalho {
  prestador_id: number
  feed_aceito_em: string | null
  feed_revogado_em: string | null
  feed_oculto: boolean | null
}

/**
 * Quem já publicou trabalho e quem já tem trabalho aceito no feed. Só colunas que o admin pode ler:
 * nada de `select('*')` em portfolio_projetos (cliente_whatsapp e tokens não são liberados).
 */
export async function listarTrabalhosPorPrestador(): Promise<TrabalhosPorPrestador> {
  const linhas = await buscarTodasAsLinhas<LinhaDeTrabalho>((de, ate) =>
    supabase
      .from('portfolio_projetos')
      .select('prestador_id, feed_aceito_em, feed_revogado_em, feed_oculto')
      .order('id')
      .range(de, ate) as unknown as PromiseLike<{ data: LinhaDeTrabalho[] | null; error: unknown }>,
  )
  const mapa: TrabalhosPorPrestador = {}
  for (const l of linhas) {
    const atual = mapa[l.prestador_id] ?? { publicou: false, noFeed: false }
    atual.publicou = true
    if (l.feed_aceito_em && !l.feed_revogado_em && !l.feed_oculto) atual.noFeed = true
    mapa[l.prestador_id] = atual
  }
  return mapa
}
