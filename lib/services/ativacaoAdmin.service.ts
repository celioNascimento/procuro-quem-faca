//lib/services/ativacaoAdmin.service.ts
//
// Lista e atualização do funil de ativação (tela /admin/ativacao). Os dados ficam na tabela
// `prestador_ativacao`, que só administradores leem: a tabela `prestadores` é pública.

import { supabase } from '@/lib/supabase'
import { buscarTodasAsLinhas } from '@/lib/supabase/paginar'
import { achatarAtivacao, type AtivacaoEmbutida } from '@/lib/ativacao/lista'

const COLUNAS = 'id, nome, whatsapp, slug, user_id, prestador_ativacao(status, enviado_em, respondeu_em, obs)'

interface LinhaDaLista {
  id: number
  nome: string | null
  whatsapp: string | null
  slug: string | null
  user_id: string | null
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
  return linhas.map(achatarAtivacao)
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
