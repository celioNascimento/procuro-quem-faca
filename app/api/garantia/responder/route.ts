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

  // Valida presença dos campos antes de chamar o service —
  // evita erro críptico do Supabase por parâmetro undefined/null.
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
    // prestadorId vem como number do JSON — Number() garante que mesmo
    // que chegue como string (ex: serialização inesperada) seja coercido
    // corretamente para o bigint do Supabase.
    const data = await responderCasoGarantia(casoId, Number(prestadorId), resposta.trim())
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    // Log server-side para diagnóstico — aparece nos Runtime Logs do Vercel
    console.error('[/api/garantia/responder]', { casoId, prestadorId, erro: message })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
