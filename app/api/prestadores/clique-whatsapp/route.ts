// app/api/prestadores/clique-whatsapp/route.ts
//
// Registra um clique no botão de WhatsApp do perfil público.
// Regras (todas aplicadas aqui, no servidor, onde o navegador não pode burlar):
//   - ignora robôs (user-agent)
//   - ignora o clique do próprio prestador logado
//   - conta no máximo 1 clique por sessão e prestador a cada 24h
//   - grava origem e campanha (utm) junto com o clique
//   - durante o teste por amostra, só registra prestadores da tabela rastreio_amostra
// Sempre responde ok quando o clique é ignorado, para o botão nunca travar.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isBot } from '@/lib/tracking/isBot'
import { COOKIE_ORIGEM, resolverOrigem } from '@/lib/tracking/origem'
import { gravarCookieSessao, obterSessao } from '@/lib/tracking/sessao'
import { rastreioAtivoPara } from '@/lib/services/rastreio.service'
import {
  buscarPrestadorParaClique,
  inserirClique,
  jaContouCliqueRecente,
} from '@/lib/services/cliques.service'

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

    // 2) O prestador precisa existir; e, no teste por amostra, precisa estar nela
    const db = getAdminClient()
    const [prestador, rastrear] = await Promise.all([
      buscarPrestadorParaClique(db, prestadorId),
      rastreioAtivoPara(db, prestadorId),
    ])
    if (!prestador) {
      return NextResponse.json({ error: 'Prestador não encontrado.' }, { status: 404 })
    }
    if (!rastrear) return responder(false)

    // 3) Clique do próprio dono do perfil não conta
    if (prestador.user_id) {
      const auth = await createClient()
      const { data } = await auth.auth.getUser()
      if (data.user?.id === prestador.user_id) return responder(false)
    }

    // 4) No máximo 1 clique por sessão e prestador a cada 24h
    if (await jaContouCliqueRecente(db, prestadorId, sessao.id)) return responder(false)

    // 5) Grava com origem e campanha
    const { origem, campanha } = resolverOrigem({
      cookie: request.cookies.get(COOKIE_ORIGEM)?.value,
      referer: request.headers.get('referer'),
    })

    await inserirClique(db, { prestadorId, origem, campanha, sessaoId: sessao.id })
    return responder(true)
  } catch (error) {
    console.error('[clique-whatsapp] Erro ao registrar clique:', error)
    return NextResponse.json({ error: 'Não foi possível registrar o clique.' }, { status: 500 })
  }
}
