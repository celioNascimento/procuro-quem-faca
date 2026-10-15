import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prestadorId = Number(body?.prestadorId)

    if (!Number.isInteger(prestadorId) || prestadorId <= 0) {
      return NextResponse.json({ error: 'Prestador inválido.' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: prestador, error: leituraError } = await supabase
      .from('prestadores')
      .select('id, cliques_whatsapp')
      .eq('id', prestadorId)
      .single()

    if (leituraError || !prestador) {
      return NextResponse.json({ error: 'Prestador não encontrado.' }, { status: 404 })
    }

    const { error: atualizacaoError } = await supabase
      .from('prestadores')
      .update({ cliques_whatsapp: (prestador.cliques_whatsapp ?? 0) + 1 })
      .eq('id', prestadorId)

    if (atualizacaoError) throw atualizacaoError

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[clique-whatsapp] Erro ao registrar clique:', error)
    return NextResponse.json({ error: 'Não foi possível registrar o clique.' }, { status: 500 })
  }
}
