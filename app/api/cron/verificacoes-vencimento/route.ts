// app/api/cron/verificacoes-vencimento/route.ts
//
// Seguro e CND: uma vez por dia (cron da Vercel — vercel.json) marca como 'expirada' a verificação vencida
// e avisa o prestador por e-mail 30, 15 e 3 dias antes. O selo já sai do perfil sozinho no dia do
// vencimento (as consultas só contam selo vigente); aqui só deixamos o estado fiel e avisamos.
// Rodar mais de uma vez no mesmo dia é seguro: o aviso de cada prazo só é enviado (e marcado) uma vez.
// A Vercel envia "Authorization: Bearer <CRON_SECRET>". Sem CRON_SECRET configurado, a rota recusa tudo.

import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { enviarEmail } from '@/lib/notificacoes/email'
import { mensagemAviso, type TipoDocumento } from '@/lib/selos/documentos'

export const maxDuration = 60

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo) return NextResponse.json({ error: 'Rota não configurada.' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()

    const { data: expiradas, error: erroExpirar } = await admin.rpc('verificacoes_expirar')
    if (erroExpirar) throw erroExpirar

    const { data: lista, error: erroLista } = await admin.rpc('verificacoes_a_avisar')
    if (erroLista) throw erroLista

    let avisados = 0
    let semEmail = 0
    for (const a of (lista ?? []) as { verificacao_id: string; user_id: string; tipo: TipoDocumento; dias: number }[]) {
      const { data: usuario } = await admin.auth.admin.getUserById(a.user_id)
      const destino = usuario?.user?.email
      if (!destino) { semEmail++; continue }
      const { titulo, corpo } = mensagemAviso(a.tipo, a.dias)
      const r = await enviarEmail({ assunto: titulo, texto: corpo }, process.env, destino)
      // Só marca como avisado se o e-mail saiu; senão tenta de novo no próximo ciclo do dia.
      if (r.enviado) {
        const { error } = await admin.rpc('verificacoes_marcar_aviso', { p_verificacao_id: a.verificacao_id, p_dias: a.dias })
        if (error) throw error
        avisados++
      }
    }

    return NextResponse.json({ ok: true, expiradas: expiradas ?? 0, avisados, sem_email: semEmail })
  } catch (e) {
    console.error('[cron] vencimento de seguro/CND falhou', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({ error: 'Falha ao processar os vencimentos.' }, { status: 500 })
  }
}
