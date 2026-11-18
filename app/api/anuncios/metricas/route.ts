// app/api/anuncios/metricas/route.ts
// Responsabilidade única: validar a requisição HTTP e delegar ao service.

import { NextRequest, NextResponse } from 'next/server'
import { incrementarMetricaAnuncio, type TipoMetrica } from '@/lib/services/anunciosMetricas.service'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerAuthClient } from '@/lib/supabase/server'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — leitura de métricas diárias para o painel admin
// Só admin: usa service_role para contornar RLS, então a checagem de quem chama é obrigatória.
export async function GET(req: NextRequest) {
  try {
    const auth = await createServerAuthClient()
    const { data: { user } } = await auth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const { data: admin } = await auth.from('perfis_admin').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dataInicio = searchParams.get('dataInicio')

    if (!dataInicio) {
      return NextResponse.json({ error: 'Parâmetro dataInicio obrigatório.' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('anuncios_metricas_diarias')
      .select('anuncio_id, data_referencia, impressoes, cliques')
      .gte('data_referencia', dataInicio)
      .order('data_referencia', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[metricas] Erro ao buscar métricas:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// POST — registro de impressão ou clique
export async function POST(req: NextRequest) {
  try {
    const { anuncioId, segmentacaoId, tipo } = await req.json()

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
