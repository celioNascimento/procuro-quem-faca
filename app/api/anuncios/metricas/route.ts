// app/api/anuncios/metricas/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { anuncioId, segmentacaoId, tipo } = body

    if (!anuncioId || !segmentacaoId || !tipo) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    if (tipo !== 'impressao' && tipo !== 'clique') {
      return NextResponse.json({ error: 'Tipo deve ser "impressao" ou "clique".' }, { status: 400 })
    }

    const supabase = createClient()
    const hoje = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

    const incremento = tipo === 'impressao'
      ? { impressoes: 1, cliques: 0 }
      : { impressoes: 0, cliques: 1 }

    // Tenta inserir o registro do dia. Se já existe (unique_anuncio_segmentacao_data),
    // faz upsert somando ao contador existente via RPC para evitar race condition.
    const { error } = await supabase.rpc('incrementar_metrica_anuncio', {
      p_anuncio_id: anuncioId,
      p_segmentacao_id: segmentacaoId,
      p_data_referencia: hoje,
      p_impressoes: incremento.impressoes,
      p_cliques: incremento.cliques,
    })

    if (error) {
      console.error('[metricas] Erro ao registrar métrica:', error)
      return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[metricas] Exceção:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
