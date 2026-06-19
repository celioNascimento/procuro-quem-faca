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