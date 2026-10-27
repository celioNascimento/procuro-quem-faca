// app/api/admin/cliques/route.ts
//
// Resumo dos cliques no WhatsApp para a página /admin/cliques.
// Só para admin (mesma checagem das outras rotas de /api/admin). Usa o cliente
// administrativo para enxergar também as tabelas do rastreio, que não têm
// política de leitura para o navegador.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { lerConfigRastreio } from '@/lib/services/rastreio.service'
import { buscarNomesDePrestadores, listarCliquesDesde } from '@/lib/services/cliques.service'
import { inicioDoPeriodo, resumirCliques } from '@/lib/tracking/resumo'

export const dynamic = 'force-dynamic'

const PERIODOS_PERMITIDOS = [7, 30, 90]

export async function GET(request: NextRequest) {
  try {
    const auth = await createClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: adminProfile } = await auth
      .from('perfis_admin')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminProfile) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const pedido = Number(request.nextUrl.searchParams.get('dias'))
    const dias = PERIODOS_PERMITIDOS.includes(pedido) ? pedido : 30

    const db = getAdminClient()
    const agora = new Date()

    const [{ linhas, truncado }, rastreio] = await Promise.all([
      listarCliquesDesde(db, inicioDoPeriodo(agora, dias)),
      lerConfigRastreio(db),
    ])

    const resumo = resumirCliques(linhas, agora, dias)
    const nomes = await buscarNomesDePrestadores(db, resumo.porPrestador.map((p) => p.prestadorId))

    return NextResponse.json({
      dias,
      truncado,
      rastreio,
      resumo: {
        ...resumo,
        porPrestador: resumo.porPrestador.map((p) => ({ ...p, nome: nomes[p.prestadorId] ?? null })),
      },
    })
  } catch (error) {
    console.error('[admin/cliques] Erro ao montar o resumo:', error)
    return NextResponse.json({ error: 'Não foi possível carregar os cliques.' }, { status: 500 })
  }
}
