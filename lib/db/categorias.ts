import { supabase } from '@/lib/supabase'

export async function getSugestoesDestaque() {
  return supabase
    .from('categorias_por_popularidade')
    .select('nome')
    .limit(8)
}

export async function getSugestoesPorBusca(termo: string) {
  return supabase
    .from('categorias')
    .select('nome')
    .ilike('nome', `%${termo.trim()}%`)
    .limit(6)
}
