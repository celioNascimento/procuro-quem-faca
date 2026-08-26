// app/api/anuncios/metricas/route.ts
// Responsabilidade única: validar a requisição HTTP e delegar ao service.

import { NextRequest, NextResponse } from 'next/server'
import { incrementarMetricaAnuncio, type TipoMetrica } from '@/lib/services/anunciosMetricas.service'

export async function POST(req: NextRequest) {
  try {
    const { anuncioId, segmentacaoId, tipo } = await req.json()

    // segmentacaoId ausente = anúncio ainda sem segmentação resolvida
    // (ex: listagem admin que não carrega segmentacao_id_ativa).
    // Descarta silenciosamente — não é erro de negócio, não deve poluir o
    // estado de erro do cliente.
    if (!anuncioId || !tipo) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    if (!segmentacaoId) {
      return NextResponse.json({ ok: true, descartado: true })
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
