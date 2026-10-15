// lib/tracking/sessao.ts
//
// ID anônimo de sessão, gerado pelo servidor e guardado em cookie (30 dias).
// Não contém IP nem dado pessoal; serve só para contar "pessoas diferentes"
// e evitar contar o mesmo clique várias vezes.

import { randomUUID } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'

export const COOKIE_SESSAO = 'pqf_sid'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function obterSessao(request: NextRequest): { id: string; novo: boolean } {
  const existente = request.cookies.get(COOKIE_SESSAO)?.value
  if (existente && UUID.test(existente)) return { id: existente, novo: false }
  return { id: randomUUID(), novo: true }
}

export function gravarCookieSessao(response: NextResponse, id: string): void {
  response.cookies.set(COOKIE_SESSAO, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
