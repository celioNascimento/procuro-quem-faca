import { getAdminClient } from '@/lib/supabase/admin'
import { normalizeAdminPrestador, type AdminPrestadoresFilters, type AdminPrestador } from '@/types/adminPrestadores'

export async function listarPrestadoresAdmin(filters: AdminPrestadoresFilters): Promise<AdminPrestador[]> {
  const supabase = getAdminClient()
  let query = supabase.from('prestadores').select('*, categorias(nome), cidades(nome)').order('created_at', { ascending: false })
  if (filters.busca) query = query.or(`nome.ilike.%${filters.busca}%,whatsapp.ilike.%${filters.busca}%`)
  if (filters.cidade) query = query.eq('cidade_id', filters.cidade)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => normalizeAdminPrestador(row as Record<string, any>))
}
