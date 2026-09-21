import { supabase } from '@/lib/supabase'

export async function getSugestoesDestaque() {
  return supabase
    .from('categorias_por_popularidade')
    .select('nome')
    .limit(8)
}

export async function getSugestoesPorBusca(termo: string, cidadeId?: string | null) {
  const busca = termo.trim()
  const categorias = await supabase
    .from('categorias')
    .select('id, nome')
    .ilike('nome', `%${busca}%`)
    .limit(24)

  if (categorias.error || !cidadeId) {
    return {
      data: (categorias.data ?? []).slice(0, 6).map(({ nome }) => ({ nome })),
      error: categorias.error,
    }
  }

  const ids = categorias.data.map(({ id }) => id)
  if (ids.length === 0) return { data: [], error: null }

  const prestadores = await supabase
    .from('prestadores')
    .select('categoria_id')
    .eq('cidade_id', cidadeId)
    .eq('status', 'ativo')
    .eq('bloqueado', false)
    .in('categoria_id', ids)

  if (prestadores.error) return prestadores

  const idsDisponiveis = new Set((prestadores.data ?? []).map(({ categoria_id }) => String(categoria_id)))
  return {
    data: categorias.data
      .filter(({ id }) => idsDisponiveis.has(String(id)))
      .slice(0, 6)
      .map(({ nome }) => ({ nome })),
    error: null,
  }
}
