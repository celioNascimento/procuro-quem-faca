import { describe, expect, it } from 'vitest'
import { CHECKLIST, checklistCompleto, itensPendentes } from './checklistDocumentos'

describe('checklist de conferência', () => {
  it('seguro e CND têm itens, com ids únicos por tipo', () => {
    for (const tipo of ['seguro', 'cnd'] as const) {
      const ids = CHECKLIST[tipo].map((i) => i.id)
      expect(ids.length).toBeGreaterThanOrEqual(4)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
  it('só está completo com todos os itens marcados', () => {
    const todos = CHECKLIST.seguro.map((i) => i.id)
    expect(checklistCompleto('seguro', todos)).toBe(true)
    expect(checklistCompleto('seguro', todos.slice(1))).toBe(false)
    expect(checklistCompleto('seguro', [])).toBe(false)
  })
  it('itens de um tipo não completam o outro', () => {
    expect(checklistCompleto('cnd', CHECKLIST.seguro.map((i) => i.id))).toBe(false)
  })
  it('lista o que falta', () => {
    expect(itensPendentes('cnd', ['cnpj', 'tipo']).map((i) => i.id)).toEqual(['emissao', 'autentica', 'legivel'])
  })
  it('CND exige conferir o código de controle e a CPEND é aceita', () => {
    expect(CHECKLIST.cnd.some((i) => i.id === 'autentica')).toBe(true)
    expect(CHECKLIST.cnd.find((i) => i.id === 'tipo')?.texto).toMatch(/CPEND/)
  })
})
