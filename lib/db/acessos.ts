//lib/db/acessos.ts

import { supabase } from '@/lib/supabase'
import { insertLog } from './logs'

export interface AcessoPayload {
  userId: string | null
  userEmail: string | null
}

/**
 * Registra um acesso de sessão em logs_atividades.
 * Não usa insertLog diretamente pois precisa gravar userId/email
 * de quem não está autenticado ainda (sessão pode ser null).
 */
export async function insertAcesso(payload: AcessoPayload): Promise<void> {
  const { error } = await supabase.from('logs_atividades').insert({
    acao: 'acesso_sessao',
    detalhes: {},
    usuario_id: payload.userId,
    usuario_email: payload.userEmail,
  })

  if (error) throw error
}