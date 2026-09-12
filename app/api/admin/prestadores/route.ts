import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listarPrestadoresAdmin } from '@/lib/services/adminPrestadores.service'
import { matchesTab, type PrestadorTab } from '@/types/adminPrestadores'

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: adminProfile } = await authClient
      .from('perfis_admin')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminProfile) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const params = request.nextUrl.searchParams
    const tab = (params.get('tab') ?? 'todos') as PrestadorTab
    const prestadores = await listarPrestadoresAdmin({ busca: params.get('busca') ?? '', origem: params.get('origem') ?? '', cidade: params.get('cidade') ?? '', categoria: params.get('categoria') ?? '', grupoCategoria: params.get('grupoCategoria') ?? '' })
    const filtrados = prestadores.filter((item) => matchesTab(item, tab) && (!params.get('origem') || item.origem_tipo === params.get('origem')))
    const totais = { todos: prestadores.length, publico: prestadores.filter((item) => item.etapa === 'publico').length, cadastro: prestadores.filter((item) => item.etapa === 'cadastro').length, reivindicado: prestadores.filter((item) => item.etapa === 'reivindicado').length, ativo: prestadores.filter((item) => item.etapa === 'ativo').length, acompanhar: prestadores.filter((item) => item.contatoStatus !== 'sem_contato').length }
    return NextResponse.json({ prestadores: filtrados, totais })
  } catch (error) {
    console.error('[v0] admin prestadores error', error)
    return NextResponse.json({ error: 'Não foi possível carregar os prestadores.' }, { status: 500 })
  }
}
