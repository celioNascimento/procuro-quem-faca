import { describe, it, expect } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_ORIGEM } from './origem'
import { gravarOrigemSeNecessario } from './gravarOrigem'

function requisicao(url: string, cookieOrigem?: string) {
  const req = new NextRequest(url)
  if (cookieOrigem) req.cookies.set(COOKIE_ORIGEM, cookieOrigem)
  return req
}

describe('gravarOrigemSeNecessario', () => {
  it('grava o cookie quando a URL tem utm_source e utm_campaign', () => {
    const req = requisicao('https://site.com/pedreiro-em-londrina?utm_source=Meta&utm_campaign=Gleba Palhano')
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    const cookie = res.cookies.get(COOKIE_ORIGEM)
    expect(cookie).toBeDefined()
    expect(JSON.parse(decodeURIComponent(cookie!.value))).toEqual({ o: 'meta', c: 'gleba-palhano' })
  })

  it('NÃO grava cookie quando a URL não tem utm_source nem src', () => {
    const req = requisicao('https://site.com/pedreiro-em-londrina')
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    expect(res.cookies.get(COOKIE_ORIGEM)).toBeUndefined()
  })

  it('NÃO sobrescreve um cookie já existente (first-touch)', () => {
    const cookieExistente = encodeURIComponent(JSON.stringify({ o: 'google', c: 'seo' }))
    const req = requisicao(
      'https://site.com/pedreiro-em-londrina?utm_source=meta&utm_campaign=novo',
      cookieExistente,
    )
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    // Como já havia cookie, a função não grava nada na resposta.
    expect(res.cookies.get(COOKIE_ORIGEM)).toBeUndefined()
  })

  it('usa src quando não há utm_source', () => {
    const req = requisicao('https://site.com/pedreiro-em-londrina?src=ativacao')
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    const cookie = res.cookies.get(COOKIE_ORIGEM)
    expect(JSON.parse(decodeURIComponent(cookie!.value))).toEqual({ o: 'ativacao', c: null })
  })
})
