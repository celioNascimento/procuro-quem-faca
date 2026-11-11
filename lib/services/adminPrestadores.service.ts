import { getAdminClient } from '@/lib/supabase/admin'
import { buscarTodasAsLinhas } from '@/lib/supabase/paginar'
import { achatarAtivacao } from '@/lib/ativacao/lista'
import { normalizeAdminPrestador, type AdminPrestadoresFilters, type AdminPrestador } from '@/types/adminPrestadores'

export async function listarPrestadoresAdmin(filters: AdminPrestadoresFilters): Promise<AdminPrestador[]> {
  const supabase = getAdminClient()
  const montarConsulta = () => {
    let query = supabase
      .from('prestadores')
      .select('*, categorias(id, nome, grupo_id, categorias_grupos(id, nome)), cidades(nome, estado_sigla), prestador_ativacao(status, enviado_em, respondeu_em, obs)')
      .order('created_at', { ascending: false })
      .order('id')
    if (filters.busca) query = query.or(`nome.ilike.%${filters.busca}%,whatsapp.ilike.%${filters.busca}%`)
    if (filters.cidade) query = query.eq('cidade_id', filters.cidade)
    if (filters.categoria) query = query.eq('categoria_id', filters.categoria)
    if (filters.grupoCategoria) query = query.eq('grupo_id', filters.grupoCategoria)
    return query
  }
  // Paginado: o PostgREST corta em 1000 linhas e a tabela já tem 957 perfis
  const linhas = await buscarTodasAsLinhas<Record<string, unknown>>((de, ate) =>
    montarConsulta().range(de, ate) as unknown as PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>,
  )
  return linhas.map((row) => normalizeAdminPrestador(achatarAtivacao(row) as Record<string, unknown>))
}
