import { describe, it, expect } from 'vitest'
import {
  normalizarTexto,
  extrairOrigemDeUrl,
  extrairOrigemDeCookie,
  resolverOrigem,
} from './origem'

describe('normalizarTexto', () => {
  it('põe em minúsculo, remove acento e troca espaço por hífen', () => {
    expect(normalizarTexto('São Paulo!!', 60)).toBe('sao-paulo')
    expect(normalizarTexto('  META ', 60)).toBe('meta')
  })

  it('remove caracteres perigosos', () => {
    expect(normalizarTexto("<script>alert('x')</script>", 100)).toBe('scriptalertxscript')
  })

  it('respeita o tamanho máximo', () => {
    expect(normalizarTexto('a'.repeat(200), 60)?.length).toBe(60)
  })

  it('devolve null para vazio ou tipo errado', () => {
    expect(normalizarTexto('', 60)).toBeNull()
    expect(normalizarTexto('!!!', 60)).toBeNull()
    expect(normalizarTexto(123, 60)).toBeNull()
    expect(normalizarTexto(undefined, 60)).toBeNull()
  })
})

describe('extrairOrigemDeUrl', () => {
  it('lê utm_source e utm_campaign', () => {
    expect(
      extrairOrigemDeUrl('https://site.com/slug?utm_source=Meta&utm_campaign=Gleba Palhano'),
    ).toEqual({ origem: 'meta', campanha: 'gleba-palhano' })
  })

  it('usa src quando não há utm_source', () => {
    expect(extrairOrigemDeUrl('https://site.com/slug?src=ativacao').origem).toBe('ativacao')
  })

  it('devolve vazio para URL inválida ou ausente', () => {
    expect(extrairOrigemDeUrl('isto nao e url')).toEqual({ origem: null, campanha: null })
    expect(extrairOrigemDeUrl(null)).toEqual({ origem: null, campanha: null })
  })
})

describe('extrairOrigemDeCookie', () => {
  it('lê o cookie codificado', () => {
    const cookie = encodeURIComponent(JSON.stringify({ o: 'meta', c: 'gleba-palhano' }))
    expect(extrairOrigemDeCookie(cookie)).toEqual({ origem: 'meta', campanha: 'gleba-palhano' })
  })

  it('ignora cookie corrompido', () => {
    expect(extrairOrigemDeCookie('%%%nao-e-json')).toEqual({ origem: null, campanha: null })
  })
})

describe('resolverOrigem', () => {
  it('prefere o cookie ao endereço da página', () => {
    const cookie = encodeURIComponent(JSON.stringify({ o: 'google', c: 'seo' }))
    expect(
      resolverOrigem({ cookie, referer: 'https://site.com/x?utm_source=meta' }),
    ).toEqual({ origem: 'google', campanha: 'seo' })
  })

  it('usa o endereço da página quando não há cookie', () => {
    expect(
      resolverOrigem({ cookie: null, referer: 'https://site.com/x?utm_source=meta&utm_campaign=teste' }),
    ).toEqual({ origem: 'meta', campanha: 'teste' })
  })

  it("devolve 'direto' quando não há nenhuma pista", () => {
    expect(resolverOrigem({ cookie: null, referer: 'https://site.com/x' })).toEqual({
      origem: 'direto',
      campanha: null,
    })
    expect(resolverOrigem({})).toEqual({ origem: 'direto', campanha: null })
  })
})
