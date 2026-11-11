// app/api/cron/resumo-pendencias/route.ts
//
// Resumo diário das pendências, chamado pelo cron da Vercel (vercel.json). A Vercel envia
// "Authorization: Bearer <CRON_SECRET>". Sem CRON_SECRET configurado, a rota recusa tudo.
// Se não houver pendências, não envia e-mail.

import { NextResponse } from 'next/server'
import { contarPendenciasServidor } from '@/lib/services/pendenciasServidor.service'
import { emailResumoPendencias, totalPendencias } from '@/lib/notificacoes/mensagens'
import { enviarEmail } from '@/lib/notificacoes/email'

function dataDeHoje(): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo) return NextResponse.json({ error: 'Rota não configurada.' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const pendencias = await contarPendenciasServidor()
    const email = emailResumoPendencias(pendencias, dataDeHoje())
    if (!email) return NextResponse.json({ ok: true, total: 0, enviado: false })

    const resultado = await enviarEmail(email)
    return NextResponse.json({
      ok: true,
      total: totalPendencias(pendencias),
      enviado: resultado.enviado,
      motivo: resultado.enviado ? undefined : resultado.motivo,
    })
  } catch (e) {
    console.error('[cron] resumo de pendências falhou', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({ error: 'Falha ao gerar o resumo.' }, { status: 500 })
  }
}
