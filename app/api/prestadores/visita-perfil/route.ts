// app/api/prestadores/visita-perfil/route.ts
//
// Registra uma visita ao perfil público de um prestador.
// Regras (todas aplicadas aqui, no servidor, onde o navegador não pode burlar):
//   - ignora robôs (user-agent)
//   - ignora a visita do próprio prestador logado
//   - conta no máximo 1 visita por sessão e prestador a cada 24h
//   - grava origem e campanha (utm) junto com a visita
//   - respeita o modo do rastreio (todos | amostra), a mesma regra dos cliques
// Sempre responde ok quando a visita é ignorada, para a página nunca travar.
// Usa o mesmo cookie de sessão (pqf_sid) dos cliques, então visita e clique da
// mesma pessoa podem ser ligados depois no funil.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isBot } from '@/lib/tracking/isBot'
import { COOKIE_ORIGEM, resolverOrigem } from '@/lib/tracking/origem'
import { gravarCookieSessao, obterSessao } from '@/lib/tracking/sessao'
import { rastreioAtivoPara } from '@/lib/services/rastreio.service'
import {
  buscarPrestadorParaVisita,
  inserirVisita,
  jaContouVisitaRecente,
} from '@/lib/services/visitas.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const prestadorId = Number(body?.prestadorId)

    if (!Number.isInteger(prestadorId) || prestadorId <= 0) {
      return NextResponse.json({ error: 'Prestador inválido.' }, { status: 400 })
    }

    const sessao = obterSessao(request)
    const responder = (contado: boolean) => {
      const resposta = NextResponse.json({ ok: true, contado })
      if (sessao.novo) gravarCookieSessao(resposta, sessao.id)
      return resposta
    }

    // 1) Robôs não contam
    if (isBot(request.headers.get('user-agent'))) return responder(false)

    // 2) O prestador precisa existir e o rastreio precisa estar ativo para ele
    const db = getAdminClient()
    const [prestador, rastrear] = await Promise.all([
      buscarPrestadorParaVisita(db, prestadorId),
      rastreioAtivoPara(db, prestadorId),
    ])
    if (!prestador) {
      return NextResponse.json({ error: 'Prestador não encontrado.' }, { status: 404 })
    }
    if (!rastrear) return responder(false)

    // 3) A visita do próprio dono do perfil não conta
    const auth = await createClient()
    const { data: dadosUsuario } = await auth.auth.getUser()
    if (prestador.user_id && dadosUsuario.user?.id === prestador.user_id) return responder(false)

    // 4) No máximo 1 visita por sessão e prestador a cada 24h
    if (await jaContouVisitaRecente(db, prestadorId, sessao.id)) return responder(false)

    // 5) Grava com origem e campanha
    const { origem, campanha } = resolverOrigem({
      cookie: request.cookies.get(COOKIE_ORIGEM)?.value,
      referer: request.headers.get('referer'),
    })

    await inserirVisita(db, { prestadorId, origem, campanha, sessaoId: sessao.id })

    return responder(true)
  } catch (error) {
    console.error('[visita-perfil] Erro ao registrar visita:', error)
    return NextResponse.json({ error: 'Não foi possível registrar a visita.' }, { status: 500 })
  }
}