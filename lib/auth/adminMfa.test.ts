import { describe, expect, it } from 'vitest'
import { normalizarCodigo, precisaCadastrarDuasEtapas, precisaDoCodigo } from './adminMfa'

describe('verificação em duas etapas do admin', () => {
  it('pede o código só quando há segundo fator cadastrado e ainda não foi provado', () => {
    expect(precisaDoCodigo({ currentLevel: 'aal1', nextLevel: 'aal2' })).toBe(true)
    expect(precisaDoCodigo({ currentLevel: 'aal2', nextLevel: 'aal2' })).toBe(false)
    expect(precisaDoCodigo({ currentLevel: 'aal1', nextLevel: 'aal1' })).toBe(false)
    expect(precisaDoCodigo(null)).toBe(false)
  })

  it('aceita o código com ou sem espaço e recusa o que não for 6 números', () => {
    expect(normalizarCodigo('123456')).toBe('123456')
    expect(normalizarCodigo(' 123 456 ')).toBe('123456')
    expect(normalizarCodigo('12345')).toBeNull()
    expect(normalizarCodigo('12345a')).toBeNull()
    expect(normalizarCodigo('1234567')).toBeNull()
  })
})

describe('precisaCadastrarDuasEtapas', () => {
  it('só quando o Supabase confirma que não há segundo fator cadastrado', () => {
    expect(precisaCadastrarDuasEtapas({ currentLevel: 'aal1', nextLevel: 'aal1' })).toBe(true)
    expect(precisaCadastrarDuasEtapas({ currentLevel: 'aal1', nextLevel: 'aal2' })).toBe(false)
    expect(precisaCadastrarDuasEtapas({ currentLevel: 'aal2', nextLevel: 'aal2' })).toBe(false)
    expect(precisaCadastrarDuasEtapas(null)).toBe(false)
    expect(precisaCadastrarDuasEtapas({ currentLevel: null, nextLevel: null })).toBe(false)
  })
})
