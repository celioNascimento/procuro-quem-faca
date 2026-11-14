// lib/localizacao.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { conviteDispensado, dispensarConvite, extrairCidadeDoNominatim } from '@/lib/localizacao'

describe('extrairCidadeDoNominatim', () => {
  it('pega cidade e estado', () => {
    expect(extrairCidadeDoNominatim({ address: { city: 'Londrina', 'ISO3166-2-lvl4': 'BR-PR' } }))
      .toEqual({ nome: 'Londrina', estado: 'PR' })
  })
  it('aceita town e municipality quando não há city', () => {
    expect(extrairCidadeDoNominatim({ address: { town: 'Rolândia', state_code: 'BR-PR' } })?.nome).toBe('Rolândia')
    expect(extrairCidadeDoNominatim({ address: { municipality: 'Cambé' } })).toEqual({ nome: 'Cambé', estado: null })
  })
  it('sem endereço ou sem cidade, devolve null', () => {
    expect(extrairCidadeDoNominatim(null)).toBeNull()
    expect(extrairCidadeDoNominatim({})).toBeNull()
    expect(extrairCidadeDoNominatim({ address: { state: 'Paraná' } })).toBeNull()
  })
})

describe('convite de localização', () => {
  afterEach(() => localStorage.clear())

  it('depois de dispensar, não insiste por 30 dias', () => {
    const hoje = Date.UTC(2026, 10, 14)
    expect(conviteDispensado(hoje)).toBe(false)
    dispensarConvite(hoje)
    expect(conviteDispensado(hoje + 29 * 86_400_000)).toBe(true)
    expect(conviteDispensado(hoje + 31 * 86_400_000)).toBe(false)
  })
})
