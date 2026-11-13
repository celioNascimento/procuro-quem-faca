import { describe, expect, it } from 'vitest'
import { destinoReivindicacaoSeguro } from '@/lib/auth/destinoReivindicacao'

const TOKEN = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'

describe('destinoReivindicacaoSeguro', () => {
  it('aceita o endereço do link pessoal de reivindicação', () => {
    expect(destinoReivindicacaoSeguro(`/cadastro?reivindicar=1592&token=${TOKEN}`)).toBe(`/cadastro?reivindicar=1592&token=${TOKEN}`)
  })

  it('aceita token em maiúsculas', () => {
    const maiusculo = TOKEN.toUpperCase()
    expect(destinoReivindicacaoSeguro(`/cadastro?reivindicar=7&token=${maiusculo}`)).toBe(`/cadastro?reivindicar=7&token=${maiusculo}`)
  })

  it.each([null, undefined, ''])('sem destino (%j) devolve null', (valor) => {
    expect(destinoReivindicacaoSeguro(valor)).toBeNull()
  })

  it.each([
    ['endereço externo', 'https://outro-site.com/cadastro?reivindicar=1&token=' + TOKEN],
    ['barras duplas', '//outro-site.com'],
    ['outra rota', `/dashboard?reivindicar=1&token=${TOKEN}`],
    ['cadastro sem reivindicar', '/cadastro'],
    ['sem token', '/cadastro?reivindicar=1592'],
    ['token fora do formato', '/cadastro?reivindicar=1592&token=abc'],
    ['id que não é número', `/cadastro?reivindicar=abc&token=${TOKEN}`],
    ['parâmetro a mais', `/cadastro?reivindicar=1&token=${TOKEN}&x=1`],
    ['texto depois do token', `/cadastro?reivindicar=1&token=${TOKEN}/../x`],
  ])('rejeita %s', (_nome, valor) => {
    expect(destinoReivindicacaoSeguro(valor)).toBeNull()
  })
})
