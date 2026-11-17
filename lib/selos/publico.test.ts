// lib/selos/publico.test.ts
import { describe, expect, it } from 'vitest'
import { diaMes, rotuloNivel, selosCnpjPorPrestador, textoSeloCnpj, type LinhaSeloPublico } from './publico'

const linha = (o: Partial<LinhaSeloPublico>): LinhaSeloPublico => ({
  prestador_id: 1, tipo: 'cnpj', verificado_em: null, valido_ate: null, consultado_em: '2026-11-17T15:00:00Z', data_abertura: null, ...o,
})

describe('selosCnpjPorPrestador', () => {
  it('agrupa só os selos de CNPJ, por prestador', () => {
    const mapa = selosCnpjPorPrestador([linha({ prestador_id: 2 }), linha({ prestador_id: 3, tipo: 'seguro' })])
    expect([...mapa.keys()]).toEqual([2])
  })
  it('lista vazia: mapa vazio', () => {
    expect(selosCnpjPorPrestador([]).size).toBe(0)
  })
})

describe('diaMes e textoSeloCnpj', () => {
  it('formata dia/mês no horário de Brasília', () => {
    expect(diaMes('2026-11-17T15:00:00Z')).toBe('17/11')
    // 01:00 UTC ainda é o dia anterior em Brasília
    expect(diaMes('2026-11-18T01:00:00Z')).toBe('17/11')
  })
  it('data ausente ou inválida: sem data', () => {
    expect(diaMes(null)).toBeNull()
    expect(diaMes('lixo')).toBeNull()
  })
  it('texto diz só o que foi conferido', () => {
    expect(textoSeloCnpj({ consultadoEm: '2026-11-17T15:00:00Z' })).toBe('CNPJ ativo, consultado em 17/11')
    expect(textoSeloCnpj({ consultadoEm: null })).toBe('CNPJ ativo')
  })
})

describe('rotuloNivel', () => {
  it('traduz os níveis conhecidos e ignora o resto', () => {
    expect(rotuloNivel('bronze')).toBe('Bronze')
    expect(rotuloNivel('diamante')).toBe('Diamante')
    expect(rotuloNivel(null)).toBeNull()
    expect(rotuloNivel('lixo')).toBeNull()
  })
})
