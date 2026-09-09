import { NextRequest, NextResponse } from 'next/server'
import { listarPrestadoresAdmin } from '@/lib/services/adminPrestadores.service'
import { matchesTab, type PrestadorTab } from '@/types/adminPrestadores'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const tab = (params.get('tab') ?? 'todos') as PrestadorTab
    const prestadores = await listarPrestadoresAdmin({ busca: params.get('busca') ?? '', origem: params.get('origem') ?? '', cidade: params.get('cidade') ?? '' })
    const filtrados = prestadores.filter((item) => matchesTab(item, tab) && (!params.get('origem') || item.origem_tipo === params.get('origem')))
    const totais = { todos: prestadores.length, publico: prestadores.filter((item) => item.etapa === 'publico').length, cadastro: prestadores.filter((item) => item.etapa === 'cadastro').length, reivindicado: prestadores.filter((item) => item.etapa === 'reivindicado').length, ativo: prestadores.filter((item) => item.etapa === 'ativo').length, acompanhar: prestadores.filter((item) => item.contatoStatus !== 'sem_contato').length }
    return NextResponse.json({ prestadores: filtrados, totais })
  } catch (error) {
    console.error('[v0] admin prestadores error', error)
    return NextResponse.json({ error: 'Não foi possível carregar os prestadores.' }, { status: 500 })
  }
}
