import { supabase } from '@/lib/supabase'

export async function getSugestoesDestaque() {
  return supabase
    .from('categorias')
    .select('nome, prestadores(count)')
    .eq('prestadores.status', 'aprovado')
    .eq('prestadores.bloqueado', false)
    .order('prestadores_count', { ascending: false })
    .limit(8)
}

export async function getSugestoesPorBusca(termo: string) {
  return supabase
    .from('categorias')
    .select('nome')
    .ilike('nome', `%${termo.trim()}%`)
    .limit(6)
}
