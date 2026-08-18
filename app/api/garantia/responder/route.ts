// app/api/garantia/responder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { responderCasoGarantia } from '@/lib/services/garantia.service'

export async function POST(req: NextRequest) {
  const { casoId, prestadorId, resposta } = await req.json()
  try {
    const data = await responderCasoGarantia(casoId, prestadorId, resposta)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
