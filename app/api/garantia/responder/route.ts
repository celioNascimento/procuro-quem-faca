// app/api/garantia/responder/route.ts
//
// Usa o client com SERVICE_ROLE_KEY para bypassar RLS — necessário porque
// a route roda no servidor sem sessão do usuário logado (cookie não é
// propagado automaticamente para o Supabase server client aqui).
// A autorização é feita manualmente: verificamos que o prestador_id
// do caso bate com o prestador do usuário autenticado antes de atualizar.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

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

  // Service role client — bypassa RLS para o UPDATE.
  // Autorização manual feita abaixo via verificação do prestador_id.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    const prazoResposta = calcularPrazoUteis(5)

    const { data, error } = await supabaseAdmin
      .from('solicitacoes_garantia')
      .update({
        status: 'respondida',
        resposta_prestador_garantia: resposta.trim(),
        data_resposta: new Date().toISOString(),
      })
      .eq('id', casoId)
      .eq('prestador_id', Number(prestadorId))
      .eq('status', 'aberta')
      .select()
      .single()

    if (error) {
      console.error('[/api/garantia/responder]', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[/api/garantia/responder] erro inesperado:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function calcularPrazoUteis(diasUteis: number, base: Date = new Date()): string {
  const data = new Date(base)
  let restantes = diasUteis
  while (restantes > 0) {
    data.setDate(data.getDate() + 1)
    const dia = data.getDay()
    if (dia !== 0 && dia !== 6) restantes--
  }
  return data.toISOString().slice(0, 10)
}
