import { describe, expect, it } from 'vitest'
import { placarIndicacoes, textoTagNaoIndicam } from './transparencia'

describe('textoTagNaoIndicam', () => {
  it('mostra a porcentagem a partir de 3 avaliações e 30%', () => {
    expect(textoTagNaoIndicam(7, 3)).toBe('30% não indicam')
    expect(textoTagNaoIndicam(2, 1)).toBe('33% não indicam')
    expect(textoTagNaoIndicam(0, 3)).toBe('100% não indicam')
    expect(textoTagNaoIndicam(4, 3)).toBe('43% não indicam')
  })
  it('não mostra com poucas avaliações (menos de 3)', () => {
    expect(textoTagNaoIndicam(0, 2)).toBeNull()
    expect(textoTagNaoIndicam(1, 1)).toBeNull()
  })
  it('não mostra abaixo de 30% de não indicações', () => {
    expect(textoTagNaoIndicam(8, 2)).toBeNull() // 20%
    expect(textoTagNaoIndicam(20, 5)).toBeNull() // 20%
    expect(textoTagNaoIndicam(10, 0)).toBeNull()
  })
  it('o limite é calculado sobre os números reais, não sobre a porcentagem arredondada', () => {
    expect(textoTagNaoIndicam(70, 29)).toBeNull() // 29,3%: arredondaria para 29%, abaixo do limite
    expect(textoTagNaoIndicam(70, 30)).toBe('30% não indicam')
  })
})

describe('placarIndicacoes', () => {
  it('soma e protege contra valores inválidos', () => {
    expect(placarIndicacoes(7, 3)).toEqual({ indicam: 7, naoIndicam: 3, total: 10 })
    expect(placarIndicacoes(-1, NaN)).toEqual({ indicam: 0, naoIndicam: 0, total: 0 })
  })
})
