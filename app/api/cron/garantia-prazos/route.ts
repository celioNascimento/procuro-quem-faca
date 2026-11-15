// app/api/cron/garantia-prazos/route.ts
//
// Cobra os prazos da garantia, uma vez por dia (cron da Vercel — vercel.json). A Vercel envia
// "Authorization: Bearer <CRON_SECRET>". Sem CRON_SECRET configurado, a rota recusa tudo.
//
// O que a rotina faz (tudo no banco, função garantia_processar_vencidos, que só o servidor executa):
//  - caso 'aberta' cujo prazo de 5 dias úteis passou  -> 'sem_resposta' (nota 1 na avaliação)
//  - oferta de reparo sem resposta do cliente há 15 dias -> 'recusada'
// Rodar duas vezes no mesmo dia é seguro: o que já foi tratado não volta a ser tratado.

import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo) return NextResponse.json({ error: 'Rota não configurada.' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { data, error } = await getAdminClient().rpc('garantia_processar_vencidos')
    if (error) throw error

    const casos = (data ?? []) as { novo_status: string }[]
    return NextResponse.json({
      ok: true,
      sem_resposta: casos.filter((c) => c.novo_status === 'sem_resposta').length,
      ofertas_recusadas: casos.filter((c) => c.novo_status === 'recusada').length,
    })
  } catch (e) {
    console.error('[cron] prazos da garantia falharam', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({ error: 'Falha ao processar os prazos.' }, { status: 500 })
  }
}
