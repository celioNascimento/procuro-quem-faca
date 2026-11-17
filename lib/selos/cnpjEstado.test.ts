// lib/selos/cnpjEstado.test.ts
import { describe, expect, it } from 'vitest'
import { faseDoSeloCnpj, type DadosSeloCnpj } from './cnpjEstado'

const dia = new Date(2026, 10, 17) // 17/11/2026, horário local
const com = (status: string, valido_ate: string | null = null): DadosSeloCnpj => ({
  verificacao: { status, valido_ate, verificado_em: null },
  cnpj: null,
})

describe('faseDoSeloCnpj', () => {
  it('sem verificação: "sem"', () => {
    expect(faseDoSeloCnpj({ verificacao: null, cnpj: null }, dia)).toBe('sem')
  })
  it('aprovada dentro da validade: "aprovado"', () => {
    expect(faseDoSeloCnpj(com('aprovada', '2026-12-22'), dia)).toBe('aprovado')
    expect(faseDoSeloCnpj(com('aprovada', '2026-11-17'), dia)).toBe('aprovado')
    expect(faseDoSeloCnpj(com('aprovada', null), dia)).toBe('aprovado')
  })
  it('aprovada vencida ou marcada como expirada: "expirado"', () => {
    expect(faseDoSeloCnpj(com('aprovada', '2026-11-16'), dia)).toBe('expirado')
    expect(faseDoSeloCnpj(com('expirada'), dia)).toBe('expirado')
  })
  it('pendente e em análise: "em_conferencia"', () => {
    expect(faseDoSeloCnpj(com('pendente'), dia)).toBe('em_conferencia')
    expect(faseDoSeloCnpj(com('em_analise'), dia)).toBe('em_conferencia')
  })
  it('rejeitada: "rejeitado"; status desconhecido: "sem"', () => {
    expect(faseDoSeloCnpj(com('rejeitada'), dia)).toBe('rejeitado')
    expect(faseDoSeloCnpj(com('qualquer'), dia)).toBe('sem')
  })
})
