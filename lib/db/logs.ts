import { supabase } from '@/lib/supabase'

export async function insertLog(
  acao: string,
  detalhes: Record<string, unknown> = {},
  entidade: string | null = null
) {
  return supabase.from('logs_atividades').insert([{
    acao,
    detalhes,
    entidade_tipo: entidade,
  }])
}