// lib/selos/publico.test.ts
import { describe, expect, it } from 'vitest'
import { diaMes, rotuloNivel, selosCnpjPorPrestador, selosComplementaresPorPrestador, textoSeloCnpj, TEXTO_EXPERIENCIA, type LinhaSeloPublico } from './publico'

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

describe('selosComplementaresPorPrestador', () => {
  const hoje = new Date(2026, 10, 18)
  it('agrupa experiência, tempo de CNPJ (pela faixa) e atividade por prestador', () => {
    const mapa = selosComplementaresPorPrestador([
      linha({ prestador_id: 1, tipo: 'experiencia' }),
      linha({ prestador_id: 1, tipo: 'tempo_cnpj', data_abertura: '2022-03-01' }),
      linha({ prestador_id: 1, tipo: 'atividade_compativel' }),
      linha({ prestador_id: 2, tipo: 'tempo_cnpj', data_abertura: '2021-01-01' }),
    ], hoje)
    expect(mapa.get(1)).toEqual({ experiencia: true, tempoCnpj: 3, atividadeCompativel: true })
    expect(mapa.get(2)).toEqual({ experiencia: false, tempoCnpj: 5, atividadeCompativel: false })
  })
  it('ignora o selo de CNPJ comum e tempo sem data válida', () => {
    const mapa = selosComplementaresPorPrestador([linha({ tipo: 'cnpj' }), linha({ prestador_id: 5, tipo: 'tempo_cnpj', data_abertura: null })], hoje)
    expect(mapa.size).toBe(0)
  })
  it('o texto da experiência cita as metas', () => {
    expect(TEXTO_EXPERIENCIA).toBe('Experiência no PQF: 10 serviços avaliados por 10 clientes diferentes')
  })
})
