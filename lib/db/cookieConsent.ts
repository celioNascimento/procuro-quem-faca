import { supabase } from '@/lib/supabase'

const ACAO = 'ACEITE_COOKIES'

export async function checkConsentLog(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('logs_atividades')
    .select('id')
    .eq('usuario_id', userId)
    .eq('acao', ACAO)
    .limit(1)
    .single()

  return !!data
}

export async function insertConsentLog(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()

  const { error } = await supabase.from('logs_atividades').insert({
    acao: ACAO,
    entidade_tipo: 'consentimento',
    usuario_id: session?.user?.id ?? null,
    usuario_email: session?.user?.email ?? null,
    detalhes: {
      navegador: window.navigator.userAgent,
      resolucao: `${window.screen.width}x${window.screen.height}`,
      data_aceite: new Date().toISOString(),
    },
  })

  if (error) throw error
}