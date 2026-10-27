// app/api/prestadores/meus-cliques/route.ts
//
// Quantos cliques no WhatsApp o perfil do prestador logado recebeu.
// Roda no servidor porque só ele sabe se o rastreio está ativo para este
// prestador (modo 'amostra'): fora da amostra os cliques não são contados, e
// mostrar "0" seria enganoso. Nesse caso responde rastreando: false.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { rastreioAtivoPara } from '@/lib/services/rastreio.service'
import {
  buscarPrestadorIdDoUsuario,
  contarCliquesDoPrestador,
} from '@/lib/services/cliques.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await createClient()
    const { data } = await auth.auth.getUser()
    if (!data.user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const db = getAdminClient()
    const prestadorId = await buscarPrestadorIdDoUsuario(db, data.user.id)
    if (prestadorId === null) {
      return NextResponse.json({ error: 'Prestador não encontrado.' }, { status: 404 })
    }

    if (!(await rastreioAtivoPara(db, prestadorId))) {
      return NextResponse.json({ rastreando: false })
    }

    const contagem = await contarCliquesDoPrestador(db, prestadorId)
    return NextResponse.json({ rastreando: true, ...contagem })
  } catch (error) {
    console.error('[meus-cliques] Erro ao ler cliques:', error)
    return NextResponse.json({ error: 'Não foi possível carregar os cliques.' }, { status: 500 })
  }
}
