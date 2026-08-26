// app/api/anuncios/metricas/route.ts
// Responsabilidade única: validar a requisição HTTP e delegar ao service.

import { NextRequest, NextResponse } from 'next/server'
import { incrementarMetricaAnuncio, type TipoMetrica } from '@/lib/services/anunciosMetricas.service'

export async function POST(req: NextRequest) {
  try {
    const { anuncioId, segmentacaoId, tipo } = await req.json()

    if (!anuncioId || !segmentacaoId || !tipo) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    if (tipo !== 'impressao' && tipo !== 'clique') {
      return NextResponse.json({ error: 'Tipo deve ser "impressao" ou "clique".' }, { status: 400 })
    }

    await incrementarMetricaAnuncio(anuncioId, segmentacaoId, tipo as TipoMetrica)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[metricas] Erro ao registrar métrica:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
