// lib/notificacoes/email.ts
//
// Envio de e-mail ao administrador pelo Resend. SOMENTE SERVIDOR: usa a chave secreta.
// Nunca lança erro: um aviso que falha não pode derrubar o pedido do titular nem a denúncia.
// Sem RESEND_API_KEY nada é enviado, e o painel e o contador continuam funcionando.

import { NOTIFICACOES } from '@/config/notificacoes'
import type { EmailNotificacao } from '@/lib/notificacoes/mensagens'

export type ResultadoEmail =
  | { enviado: true }
  | { enviado: false; motivo: 'sem_chave' | 'erro_servico' | 'erro_rede'; status?: number }

const ENDPOINT = 'https://api.resend.com/emails'
const TEMPO_LIMITE_MS = 8000

export async function enviarEmail(
  email: EmailNotificacao,
  env: Record<string, string | undefined> = process.env,
): Promise<ResultadoEmail> {
  const chave = env.RESEND_API_KEY
  if (!chave) return { enviado: false, motivo: 'sem_chave' }

  const destino = env.NOTIFICACAO_EMAIL_DESTINO || NOTIFICACOES.destinoPadrao
  const remetente = env.NOTIFICACAO_EMAIL_REMETENTE || NOTIFICACOES.remetentePadrao

  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)

  try {
    const resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: remetente, to: [destino], subject: email.assunto, text: email.texto }),
      signal: controle.signal,
    })
    if (!resposta.ok) {
      console.error('[notificacao] o serviço de e-mail recusou o envio, status', resposta.status)
      return { enviado: false, motivo: 'erro_servico', status: resposta.status }
    }
    return { enviado: true }
  } catch (e) {
    console.error('[notificacao] falha de rede ao enviar e-mail', e instanceof Error ? e.name : 'erro')
    return { enviado: false, motivo: 'erro_rede' }
  } finally {
    clearTimeout(timer)
  }
}
