//lib/db/categorias.ts

import { supabase } from '@/lib/supabase'

export async function getSugestoesDestaque() {
  return supabase
    .from('categorias')
    .select('nome')
    .eq('destaque', true)
    .limit(6)
}

export async function getSugestoesPorBusca(termo: string) {
  return supabase
    .from('categorias')
    .select('nome')
    .ilike('nome', `%${termo.trim()}%`)
    .limit(6)
}