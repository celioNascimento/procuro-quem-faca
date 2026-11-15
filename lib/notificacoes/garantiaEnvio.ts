// lib/notificacoes/garantiaEnvio.ts
//
// Envia o aviso do fluxo de garantia ao e-mail da conta do destinatário. SOMENTE SERVIDOR.
// Nunca lança erro: um aviso que falha não pode desfazer nem travar a ação da pessoa.

import { getAdminClient } from '@/lib/supabase/admin'
import { enviarEmail } from '@/lib/notificacoes/email'
import { mensagemGarantia, type Destinatario, type EventoGarantia } from '@/lib/notificacoes/garantia'

interface CasoParaAviso {
  prestador_id: number
  cliente_user_id: string
  tipo?: string | null
}

export async function notificarGarantia(
  evento: EventoGarantia,
  destinatario: Destinatario,
  caso: CasoParaAviso,
): Promise<boolean> {
  try {
    const admin = getAdminClient()
    let userId: string | null = caso.cliente_user_id
    if (destinatario === 'prestador') {
      const { data } = await admin.from('prestadores').select('user_id').eq('id', caso.prestador_id).maybeSingle()
      userId = data?.user_id ?? null
    }
    if (!userId) return false

    const { data: usuario } = await admin.auth.admin.getUserById(userId)
    const para = usuario?.user?.email
    if (!para) return false

    const { assunto, texto } = mensagemGarantia(evento, destinatario, caso.tipo ?? undefined)
    const resultado = await enviarEmail({ assunto, texto, para })
    return resultado.enviado
  } catch (e) {
    console.error('[garantia] aviso falhou', e instanceof Error ? e.message : 'erro')
    return false
  }
}
