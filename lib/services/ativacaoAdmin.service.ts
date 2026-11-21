//lib/services/ativacaoAdmin.service.ts
//
// Lista e atualização do funil de ativação (tela /admin/ativacao). Os dados ficam na tabela
// `prestador_ativacao`, que só administradores leem: a tabela `prestadores` é pública.

import { supabase } from '@/lib/supabase'
import { buscarTodasAsLinhas } from '@/lib/supabase/paginar'
import { achatarPerfil, type AtivacaoEmbutida, type LocalEmbutido } from '@/lib/ativacao/lista'
import type { LinhaDeTrabalho } from '@/lib/ativacao/funil'
import { normalizarAcessos, type AcessoDaConta } from '@/lib/ativacao/ajuda'

const COLUNAS =
  'id, nome, whatsapp, slug, user_id, exemplo, created_at, estado_sigla, cidades(nome, estado_sigla), regioes(nome), categorias(nome), ' +
  'prestador_ativacao(status, enviado_em, respondeu_em, obs)'

interface LinhaDaLista extends LocalEmbutido {
  id: number
  nome: string | null
  whatsapp: string | null
  slug: string | null
  user_id: string | null
  exemplo: boolean | null
  created_at: string | null
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

/**
 * Todos os trabalhos, só com colunas que o admin pode ler: nada de `select('*')` em portfolio_projetos
 * (cliente_whatsapp e tokens não são liberados). Alimenta o funil e a lista "Precisa de ajuda".
 */
export async function listarTrabalhosDosPrestadores(): Promise<LinhaDeTrabalho[]> {
  return buscarTodasAsLinhas<LinhaDeTrabalho>((de, ate) =>
    supabase
      .from('portfolio_projetos')
      .select('id, prestador_id, titulo, status, created_at, aceito_at, feed_aceito_em, feed_revogado_em, feed_oculto')
      .order('id')
      .range(de, ate) as unknown as PromiseLike<{ data: LinhaDeTrabalho[] | null; error: unknown }>,
  )
}

/** Criação da conta e último acesso de cada prestador com conta (só admin; o admin não lê auth.users). */
export async function listarAcessosDasContas(): Promise<AcessoDaConta[]> {
  const { data, error } = await supabase.rpc('admin_acesso_das_contas')
  if (error) throw error
  return normalizarAcessos(data)
}
