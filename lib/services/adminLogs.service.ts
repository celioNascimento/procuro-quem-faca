//lib/services/adminLogs.service.ts

import { supabase } from '@/lib/supabase'

export interface LogAtividade {
  id: string
  acao: string
  detalhes: Record<string, unknown> | null
  usuario_email: string | null
  created_at: string
}

export async function fetchLogsRecentes(limite = 1000): Promise<LogAtividade[]> {
  const { data, error } = await supabase
    .from('logs_atividades')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data || []
}