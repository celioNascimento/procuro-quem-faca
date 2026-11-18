import { describe, expect, it } from 'vitest'
import { avisoNaoIndicacoes, placarIndicacoes, textoTagNaoIndicam } from './transparencia'

describe('avisoNaoIndicacoes', () => {
  it('não avisa com poucas avaliações (menos de 3)', () => {
    expect(avisoNaoIndicacoes(0, 2)).toBeNull()
    expect(avisoNaoIndicacoes(1, 1)).toBeNull()
  })
  it('não avisa abaixo de 30% de não indicações', () => {
    expect(avisoNaoIndicacoes(8, 2)).toBeNull() // 20%
    expect(avisoNaoIndicacoes(20, 5)).toBeNull() // 20%
  })
  it('avisa a partir de 30%, com texto factual', () => {
    expect(avisoNaoIndicacoes(7, 3)).toBe('Neste perfil, 3 de 10 clientes não indicam. Leia as avaliações antes de contratar.')
    expect(avisoNaoIndicacoes(0, 3)).toContain('3 de 3')
  })
  it('placar ignora valores inválidos', () => {
    expect(placarIndicacoes(-1, NaN)).toEqual({ indicam: 0, naoIndicam: 0, total: 0 })
  })
})

describe('textoTagNaoIndicam', () => {
  it('mostra "3 de 10 não indicam" a partir de 3 avaliações e 30%', () => {
    expect(textoTagNaoIndicam(7, 3)).toBe('3 de 10 não indicam')
    expect(textoTagNaoIndicam(2, 1)).toBe('1 de 3 não indica')
  })
  it('não mostra com poucas avaliações nem abaixo de 30% (mesma regra do aviso)', () => {
    expect(textoTagNaoIndicam(0, 2)).toBeNull()
    expect(textoTagNaoIndicam(8, 2)).toBeNull()
    expect(textoTagNaoIndicam(10, 0)).toBeNull()
  })
  it('concorda com o aviso: onde há tag há aviso, e vice-versa', () => {
    for (const [i, n] of [[7, 3], [8, 2], [1, 1], [2, 1], [0, 5], [20, 5]]) {
      expect(textoTagNaoIndicam(i, n) !== null).toBe(avisoNaoIndicacoes(i, n) !== null)
    }
  })
})

