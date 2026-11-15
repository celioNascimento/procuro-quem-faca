// app/api/cron/garantia-vencidos/route.ts
//
// Rotina diária (cron da Vercel, ver vercel.json): encerra como "sem resposta" os casos de garantia
// cujo prazo de 5 dias úteis passou e encerra ofertas de reparo paradas há mais de 15 dias, avisando os
// dois lados. A Vercel envia "Authorization: Bearer <CRON_SECRET>"; sem CRON_SECRET a rota recusa tudo.

import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { notificarGarantia } from '@/lib/notificacoes/garantiaEnvio'
import type { EventoGarantia } from '@/lib/notificacoes/garantia'

interface LinhaVencida {
  caso_id: string
  prestador_id: number
  cliente_user_id: string
  novo_status: 'sem_resposta' | 'recusada'
}

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo) return NextResponse.json({ error: 'Rota não configurada.' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()
    const { data, error } = await admin.rpc('garantia_processar_vencidos')
    if (error) throw error

    const linhas = (data ?? []) as LinhaVencida[]
    for (const l of linhas) {
      const evento: EventoGarantia = l.novo_status === 'sem_resposta' ? 'sem_resposta' : 'oferta_expirada'
      const caso = { prestador_id: l.prestador_id, cliente_user_id: l.cliente_user_id }
      await notificarGarantia(evento, 'cliente', caso)
      await notificarGarantia(evento, 'prestador', caso)
    }

    return NextResponse.json({
      ok: true,
      sem_resposta: linhas.filter((l) => l.novo_status === 'sem_resposta').length,
      ofertas_expiradas: linhas.filter((l) => l.novo_status === 'recusada').length,
    })
  } catch (e) {
    console.error('[cron] garantia-vencidos falhou', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({ error: 'Falha ao processar os casos vencidos.' }, { status: 500 })
  }
}
