// lib/cnpj/validacao.test.ts
import { describe, expect, it } from 'vitest'
import { cnpjValido, mascararCnpj, normalizarCnpj } from './validacao'

describe('normalizarCnpj', () => {
  it('remove máscara e põe em maiúsculas', () => {
    expect(normalizarCnpj('11.222.333/0001-81')).toBe('11222333000181')
    expect(normalizarCnpj('ab.c1d.e2f/0001-xx')).toBe('ABC1DE2F0001XX')
  })
})

describe('mascararCnpj', () => {
  it('aplica a máscara de forma progressiva', () => {
    expect(mascararCnpj('11222')).toBe('11.222')
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(mascararCnpj('ab.c1d.e2f/0001-xx')).toBe('AB.C1D.E2F/0001-XX')
  })
})

describe('cnpjValido', () => {
  it('aceita CNPJ numérico válido (formato antigo)', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
    expect(cnpjValido('11222333000181')).toBe(true)
  })

  it('recusa dígito verificador errado', () => {
    expect(cnpjValido('11.222.333/0001-80')).toBe(false)
    expect(cnpjValido('11.222.333/0001-82')).toBe(false)
  })

  it('recusa tamanho errado e caracteres inválidos', () => {
    expect(cnpjValido('1122233300018')).toBe(false)
    expect(cnpjValido('112223330001811')).toBe(false)
    expect(cnpjValido('11.222.333/0001-8*')).toBe(false)
    expect(cnpjValido('')).toBe(false)
  })

  it('recusa sequências repetidas', () => {
    expect(cnpjValido('00000000000000')).toBe(false)
    expect(cnpjValido('11111111111111')).toBe(false)
  })

  it('aceita formato alfanumérico com DVs calculados pela regra módulo 11', () => {
    // Base 'AB1CD2EF0001' -> calcula os DVs pela mesma regra do código, com valor = ASCII - 48
    const base = 'AB1CD2EF0001'
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const v = (c: string) => c.charCodeAt(0) - 48
    const dv = (b: string, p: number[]) => {
      const r = 11 - (b.split('').reduce((s, c, i) => s + v(c) * p[i], 0) % 11)
      return r >= 10 ? 0 : r
    }
    const d1 = dv(base, pesos1)
    const d2 = dv(base + d1, pesos2)
    expect(cnpjValido(`${base}${d1}${d2}`)).toBe(true)
    expect(cnpjValido(`${base}${d1}${(d2 + 1) % 10}`)).toBe(false)
  })
})
