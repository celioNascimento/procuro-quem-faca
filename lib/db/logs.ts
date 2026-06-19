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