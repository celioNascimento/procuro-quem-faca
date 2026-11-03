import { describe, expect, it } from 'vitest'
import {
  MOSTRAR_VARIACAO_NEGATIVA,
  calcularVariacaoPercentual,
  variacaoParaExibir,
} from '@/lib/utils/variacaoVisitas'

describe('calcularVariacaoPercentual', () => {
  it('calcula alta e queda arredondadas', () => {
    expect(calcularVariacaoPercentual(940, 353)).toBe(166)
    expect(calcularVariacaoPercentual(262, 626)).toBe(-58)
    expect(calcularVariacaoPercentual(15, 10)).toBe(50)
  })

  it('sem período anterior não há base: devolve null', () => {
    expect(calcularVariacaoPercentual(10, 0)).toBeNull()
    expect(calcularVariacaoPercentual(0, 0)).toBeNull()
  })

  it('ignora valores inválidos', () => {
    expect(calcularVariacaoPercentual(NaN, 5)).toBeNull()
    expect(calcularVariacaoPercentual(5, Infinity)).toBeNull()
    expect(calcularVariacaoPercentual(-1, 5)).toBeNull()
    expect(calcularVariacaoPercentual(5, -2)).toBeNull()
  })

  it('queda total é −100%', () => {
    expect(calcularVariacaoPercentual(0, 8)).toBe(-100)
  })
})

describe('variacaoParaExibir', () => {
  it('a exibição de queda começa desligada', () => {
    expect(MOSTRAR_VARIACAO_NEGATIVA).toBe(false)
  })

  it('mostra a alta', () => {
    expect(variacaoParaExibir(940, 353)).toEqual({ percentual: 166, sentido: 'alta' })
  })

  it('não mostra a queda por padrão', () => {
    expect(variacaoParaExibir(262, 626)).toBeNull()
    expect(variacaoParaExibir(0, 8)).toBeNull()
  })

  it('mostra a queda quando a exibição negativa é ligada', () => {
    expect(variacaoParaExibir(262, 626, { mostrarNegativa: true })).toEqual({ percentual: -58, sentido: 'queda' })
  })

  it('não mostra nada sem base, sem mudança ou quando arredonda para 0%', () => {
    expect(variacaoParaExibir(10, 0)).toBeNull()
    expect(variacaoParaExibir(7, 7)).toBeNull()
    expect(variacaoParaExibir(1001, 1000)).toBeNull() // +0,1%
    expect(variacaoParaExibir(999, 1000, { mostrarNegativa: true })).toBeNull() // −0,1%
  })
})
