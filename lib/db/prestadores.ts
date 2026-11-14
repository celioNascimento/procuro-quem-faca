//lib/db/prestadores.ts
//
// Leitura pública do catálogo para a página de busca.

import { createPublicClient } from '@/lib/supabase/client'

const publicSupabase = createPublicClient()

// Só o que a lista usa. Antes era `select('*')`: trazia WhatsApp, bio e tudo mais de TODOS
// os perfis a cada visita, sem necessidade.
const COLUNAS_LISTA = [
  'id', 'nome', 'slug', 'foto_perfil', 'bairro', 'habilidades',
  'origem_tipo', 'verificado',
  'estado_sigla', 'cidade_id', 'regiao_id', 'grupo_id', 'categoria_id',
  'cidades(id, nome, estado_sigla, regiao_id, regioes(id, nome))',
  'categorias(id, nome, grupo_id, categorias_grupos(id, nome, icone))',
  'regioes(id, nome)',
].join(', ')

const TAMANHO_PAGINA = 1000

type Pagina = { data: unknown[] | null; count: number | null; error: unknown }

/**
 * O Supabase devolve no máximo ~1000 linhas por consulta e corta o resto SEM avisar.
 * Aqui lemos página por página, usando a contagem total para saber quando acabou
 * (funciona mesmo que o limite do servidor seja menor que o pedido).
 */
export async function lerTodasAsPaginas<T = unknown>(
  lerPagina: (de: number, ate: number) => PromiseLike<Pagina>,
): Promise<{ data: T[] | null; error: unknown }> {
  const todos: T[] = []
  let total: number | null = null

  for (;;) {
    // Começa onde a página anterior realmente terminou (o servidor pode ter devolvido menos que o pedido).
    const de = todos.length
    const { data, count, error } = await lerPagina(de, de + TAMANHO_PAGINA - 1)
    if (error) return { data: null, error }

    const linhas = (data ?? []) as T[]
    todos.push(...linhas)
    if (total === null) total = count

    const acabou = linhas.length === 0 || (total !== null ? todos.length >= total : linhas.length < TAMANHO_PAGINA)
    if (acabou) break
  }

  return { data: todos, error: null }
}

export async function getPrestadoresAtivos(cidadeId?: string | number | null) {
  return lerTodasAsPaginas((de, ate) => {
    let query = publicSupabase
      .from('prestadores')
      .select(COLUNAS_LISTA, { count: 'exact' })
      .eq('status', 'ativo')
      .or('bloqueado.is.null,bloqueado.eq.false')
      .order('id')
      .range(de, ate)

    if (cidadeId) query = query.eq('cidade_id', cidadeId)
    return query
  })
}

// Mesmas regras da página do perfil: avaliação visível e fora de disputa.
// Sem lista de ids na URL (com centenas de perfis ela estourava o limite do endereço).
export async function getMediasAvaliacoes() {
  return lerTodasAsPaginas<{ prestador_id: string; nota: number; nota_efetiva: number | null }>((de, ate) =>
    publicSupabase
      .from('avaliacoes')
      .select('prestador_id, nota, nota_efetiva', { count: 'exact' })
      .eq('visivel', true)
      .eq('em_disputa', false)
      .order('id')
      .range(de, ate),
  )
}
