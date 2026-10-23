import { describe, it, expect } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_ORIGEM } from './origem'
import { gravarOrigemSeNecessario } from './gravarOrigem'

function requisicao(url: string, cookieOrigem?: string) {
  const req = new NextRequest(url)
  if (cookieOrigem) req.cookies.set(COOKIE_ORIGEM, cookieOrigem)
  return req
}

// Lê o valor pelo cabeçalho Set-Cookie real (via res.headers), não pelo
// objeto ResponseCookies em memória. res.cookies.get() devolve de volta o
// valor cru que foi passado para .set(), sem simular a ida e volta HTTP —
// foi assim que uma dupla codificação (encodeURIComponent nosso + o do
// Next.js) passou despercebida nos testes antes de aparecer no smoke test
// real. Ler pelo cabeçalho pega exatamente o que vai para o navegador.
function valorNoCabecalho(res: NextResponse, nome: string): string | undefined {
  const linhas = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie') || '']
  const linha = linhas.find((c) => c.startsWith(`${nome}=`))
  if (!linha) return undefined
  return linha.split(';')[0].split('=').slice(1).join('=')
}

describe('gravarOrigemSeNecessario', () => {
  it('grava o cookie quando a URL tem utm_source e utm_campaign', () => {
    const req = requisicao('https://site.com/pedreiro-em-londrina?utm_source=Meta&utm_campaign=Gleba Palhano')
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    const valor = valorNoCabecalho(res, COOKIE_ORIGEM)
    expect(valor).toBeDefined()
    // Só UMA camada de codificação: um único decodeURIComponent já deve virar JSON válido.
    expect(JSON.parse(decodeURIComponent(valor!))).toEqual({ o: 'meta', c: 'gleba-palhano' })
  })

  it('NÃO grava cookie quando a URL não tem utm_source nem src', () => {
    const req = requisicao('https://site.com/pedreiro-em-londrina')
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    expect(valorNoCabecalho(res, COOKIE_ORIGEM)).toBeUndefined()
  })

  it('NÃO sobrescreve um cookie já existente (first-touch)', () => {
    const cookieExistente = encodeURIComponent(JSON.stringify({ o: 'google', c: 'seo' }))
    const req = requisicao(
      'https://site.com/pedreiro-em-londrina?utm_source=meta&utm_campaign=novo',
      cookieExistente,
    )
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    // Como já havia cookie, a função não grava nada na resposta.
    expect(valorNoCabecalho(res, COOKIE_ORIGEM)).toBeUndefined()
  })

  it('usa src quando não há utm_source', () => {
    const req = requisicao('https://site.com/pedreiro-em-londrina?src=ativacao')
    const res = gravarOrigemSeNecessario(req, NextResponse.next())

    const valor = valorNoCabecalho(res, COOKIE_ORIGEM)
    expect(JSON.parse(decodeURIComponent(valor!))).toEqual({ o: 'ativacao', c: null })
  })
})
