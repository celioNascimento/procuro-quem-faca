// app/api/garantia/responder/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { responderCasoGarantia } from '@/lib/services/garantia.service'

export async function POST(req: NextRequest) {
  let body: { casoId?: string; prestadorId?: number; resposta?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { casoId, prestadorId, resposta } = body

  if (!casoId || !prestadorId || !resposta?.trim()) {
    return NextResponse.json(
      { error: `Campos obrigatórios ausentes: ${[
          !casoId      && 'casoId',
          !prestadorId && 'prestadorId',
          !resposta    && 'resposta',
        ].filter(Boolean).join(', ')}` },
      { status: 400 },
    )
  }

  try {
    const data = await responderCasoGarantia(casoId, Number(prestadorId), resposta.trim())
    return NextResponse.json(data)
  } catch (err: unknown) {
    // Loga o objeto bruto — captura erros do Supabase que não são instâncias de Error
    console.error('[/api/garantia/responder] erro bruto:', JSON.stringify(err, null, 2))
    const message = err instanceof Error
      ? err.message
      : (typeof err === 'object' && err !== null && 'message' in err)
        ? String((err as any).message)
        : JSON.stringify(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
