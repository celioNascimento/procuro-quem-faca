// lib/tracking/gravarOrigem.ts
//
// Tarefa 4: grava o cookie 'pqf_origem' na primeira visita que chega com
// utm_source (ou src) na URL — por exemplo, um link de anúncio do Meta ou
// um QR code de ativação. Esse cookie é depois lido por resolverOrigem()
// (lib/tracking/origem.ts) na hora de registrar um clique no WhatsApp.
//
// Regra de atribuição: "primeiro toque" (first-touch). Se a pessoa já tem o
// cookie gravado, uma nova visita com outro utm NÃO sobrescreve — mantém a
// origem que trouxe a pessoa da primeira vez. Isso evita que, por exemplo,
// uma pessoa que clicou num anúncio do Meta e depois voltou pelo Google
// tenha a campanha original "roubada" pela segunda visita.

import type { NextRequest, NextResponse } from 'next/server'
import { COOKIE_ORIGEM, extrairOrigemDeUrl } from './origem'

// Janela de atribuição: 90 dias. Mais longa que o cookie de sessão (30 dias)
// de propósito — a pessoa pode ver o anúncio hoje e só pedir o orçamento
// (e clicar no WhatsApp) semanas depois.
const TTL_COOKIE_ORIGEM = 60 * 60 * 24 * 90

export function gravarOrigemSeNecessario(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  // Já tem cookie? Mantém o primeiro toque, não mexe em nada.
  if (request.cookies.get(COOKIE_ORIGEM)?.value) return response

  const { origem, campanha } = extrairOrigemDeUrl(request.url)
  // Sem utm_source/src na URL: não há nada de novo para gravar agora.
  // (O clique no WhatsApp ainda pode cair em 'direto' via resolverOrigem.)
  if (!origem) return response

  // NÃO fazer encodeURIComponent aqui: o response.cookies.set() do Next.js já
  // codifica o valor sozinho ao montar o cabeçalho Set-Cookie (usa
  // encodeURIComponent internamente). Codificar de novo aqui grava o cookie
  // com dupla codificação no HTTP real — e só não aparece num teste que lê de
  // volta pelo objeto ResponseCookies em memória, porque esse objeto devolve
  // o valor cru que foi passado para .set(), sem simular a ida e volta HTTP.
  const valor = JSON.stringify({ o: origem, c: campanha })
  response.cookies.set(COOKIE_ORIGEM, valor, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TTL_COOKIE_ORIGEM,
  })
  return response
}
