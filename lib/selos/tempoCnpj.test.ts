import { describe, expect, it } from 'vitest'
import { anosDeAbertura, faixaTempoCnpj, textoTempoCnpj } from './tempoCnpj'

const hoje = new Date(2026, 10, 18) // 18/11/2026

describe('anosDeAbertura', () => {
  it('conta anos completos (aniversário ainda não chegou = ano a menos)', () => {
    expect(anosDeAbertura('2025-11-18', hoje)).toBe(1)
    expect(anosDeAbertura('2025-11-19', hoje)).toBe(0)
    expect(anosDeAbertura('2021-01-10', hoje)).toBe(5)
  })
  it('data ausente, inválida ou futura: null', () => {
    expect(anosDeAbertura(null, hoje)).toBeNull()
    expect(anosDeAbertura('lixo', hoje)).toBeNull()
    expect(anosDeAbertura('2027-01-01', hoje)).toBeNull()
  })
})

describe('faixaTempoCnpj', () => {
  it('usa a maior faixa atingida: 1, 3 ou 5 anos', () => {
    expect(faixaTempoCnpj('2026-06-01', hoje)).toBeNull()
    expect(faixaTempoCnpj('2025-11-18', hoje)).toBe(1)
    expect(faixaTempoCnpj('2023-11-18', hoje)).toBe(3)
    expect(faixaTempoCnpj('2022-03-01', hoje)).toBe(3)
    expect(faixaTempoCnpj('2021-11-18', hoje)).toBe(5)
    expect(faixaTempoCnpj('2005-01-01', hoje)).toBe(5)
  })
})

describe('textoTempoCnpj', () => {
  it('singular e plural', () => {
    expect(textoTempoCnpj(1)).toBe('CNPJ aberto há mais de 1 ano')
    expect(textoTempoCnpj(3)).toBe('CNPJ aberto há mais de 3 anos')
  })
})
