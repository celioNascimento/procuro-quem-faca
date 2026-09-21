import { createPublicClient } from '@/lib/supabase/client'

const publicSupabase = createPublicClient()

export async function getPrestadoresAtivos(cidadeId?: string | number | null, signal?: AbortSignal) {
  const query = publicSupabase
    .from('prestadores')
    .select('*, cidades(id, nome, estado_sigla, regiao_id, regioes(id, nome)), categorias(id, nome, grupo_id, categorias_grupos(id, nome)), regioes(id, nome)')
    .eq('status', 'ativo')
    .or('bloqueado.is.null,bloqueado.eq.false')

  if (cidadeId) query.eq('cidade_id', cidadeId)
  if (signal) query.abortSignal(signal)

  return query
}

export async function getMediasAvaliacoes(prestadorIds?: string[], signal?: AbortSignal) {
  const query = publicSupabase
    .from('avaliacoes')
    .select('prestador_id, nota')
    .eq('visivel', true)

  if (prestadorIds?.length) query.in('prestador_id', prestadorIds)
  if (signal) query.abortSignal(signal)

  return query
}
