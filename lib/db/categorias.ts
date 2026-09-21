import { supabase } from '@/lib/supabase'

export async function getSugestoesDestaque() {
  return supabase
    .from('categorias_por_popularidade')
    .select('nome')
    .limit(8)
}

export async function getSugestoesPorBusca(termo: string, cidadeId?: string | null) {
  const busca = termo.trim()

  if (cidadeId) {
    const resposta = await supabase
      .from('prestadores')
      .select('categorias!inner(nome)')
      .eq('cidade_id', cidadeId)
      .eq('status', 'ativo')
      .eq('bloqueado', false)
      .ilike('categorias.nome', `%${busca}%`)
      .limit(24)

    if (resposta.error) return resposta

    const nomes = Array.from(new Set(
      (resposta.data ?? [])
        .map(item => {
          const categoria = Array.isArray(item.categorias) ? item.categorias[0] : item.categorias
          return categoria?.nome
        })
        .filter((nome): nome is string => Boolean(nome))
    )).slice(0, 6)

    return { data: nomes.map(nome => ({ nome })), error: null }
  }

  return supabase
    .from('categorias')
    .select('nome')
    .ilike('nome', `%${busca}%`)
    .limit(6)
}
