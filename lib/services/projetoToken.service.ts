// lib/services/projetoToken.service.ts
//
// `portfolio_projetos.avaliacao_token` é segredo de portador: o navegador NÃO pode mais ler
// a coluna (privilégio por coluna, migration 20261105190100). Os caminhos controlados são
// as funções do banco `projeto_id_por_token` e `tokens_projetos` (migration 20261105190000).
import { supabase } from '@/lib/supabase'

/** Id do projeto cujo token foi informado (exige login). null se não existir ou sem login. */
export async function obterProjetoIdPorToken(token: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('projeto_id_por_token', { p_token: token })
  if (error) throw error
  return (data as string | null) ?? null
}

/**
 * Tokens dos projetos informados que o chamador pode ver: os do cliente dono
 * (cliente_user_id) e os do próprio prestador. Quem não é nenhum dos dois não recebe nada.
 */
export async function buscarTokensDosProjetos(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {}
  const { data, error } = await supabase.rpc('tokens_projetos', { p_ids: ids })
  if (error) throw error
  const mapa: Record<string, string> = {}
  for (const row of (data ?? []) as { projeto_id: string; avaliacao_token: string }[]) {
    mapa[row.projeto_id] = row.avaliacao_token
  }
  return mapa
}

/** Anexa `avaliacao_token` a cada linha (string vazia quando o chamador não pode vê-lo). */
export async function anexarTokens<T extends { id: string }>(
  linhas: T[],
): Promise<(T & { avaliacao_token: string })[]> {
  const mapa = await buscarTokensDosProjetos(linhas.map(l => l.id))
  return linhas.map(l => ({ ...l, avaliacao_token: mapa[l.id] ?? '' }))
}
