//lib/db/logs.ts

import { supabase } from '@/lib/supabase'

export interface LogPayload {
  acao: string
  detalhes?: Record<string, unknown>
  entidadeTipo?: string | null
  entidadeId?: string | null
}

export async function insertLog(payload: LogPayload): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()

  const { error } = await supabase.from('logs_atividades').insert({
    acao: payload.acao,
    detalhes: payload.detalhes ?? {},
    entidade_tipo: payload.entidadeTipo ?? null,
    entidade_id: payload.entidadeId ?? null,
    usuario_id: session?.user?.id ?? null,
    usuario_email: session?.user?.email ?? null,
  })

  if (error) throw error
}

// ↓ FUNÇÃO NOVA — adicionar abaixo de insertLog
export async function checkLogExists(usuarioId: string, acao: string): Promise<boolean> {
  const { data } = await supabase
    .from('logs_atividades')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('acao', acao)
    .limit(1)
    .maybeSingle()

  return !!data
}


 /**
  * Assina INSERTs em logs_atividades em tempo real. Genérico — qualquer
  * página que precise reagir a novos logs (dashboard admin, tela de logs,
  * etc.) usa esta mesma função, cada uma com seu próprio callback e nome
  * de canal, para não competir entre si.
  */
 export function subscribeLogsAtividades(channelName: string, onInsert: (payload: any) => void) {
   return supabase
     .channel(channelName)
     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_atividades' }, onInsert)
    .subscribe()
 }