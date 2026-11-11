// lib/supabase/paginar.ts
//
// O PostgREST devolve no máximo 1000 linhas por consulta. A tabela `prestadores` já está perto disso
// (957 perfis): sem paginar, as telas do admin passariam a ignorar perfis em silêncio.

export const TAMANHO_PAGINA = 1000

interface Resposta<T> {
  data: T[] | null
  error: unknown
}

export async function buscarTodasAsLinhas<T>(
  consulta: (de: number, ate: number) => PromiseLike<Resposta<T>>,
  tamanho: number = TAMANHO_PAGINA,
): Promise<T[]> {
  const todas: T[] = []
  for (let de = 0; ; de += tamanho) {
    const { data, error } = await consulta(de, de + tamanho - 1)
    if (error) throw error
    const pagina = data ?? []
    todas.push(...pagina)
    if (pagina.length < tamanho) break
  }
  return todas
}
