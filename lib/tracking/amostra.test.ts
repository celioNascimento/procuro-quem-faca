import { describe, it, expect } from 'vitest'
import { deveRastrear } from './amostra'

describe('deveRastrear', () => {
  it("no modo 'todos' registra qualquer prestador", () => {
    expect(deveRastrear('todos', false)).toBe(true)
    expect(deveRastrear('todos', true)).toBe(true)
  })

  it("no modo 'amostra' registra só quem está na amostra", () => {
    expect(deveRastrear('amostra', true)).toBe(true)
    expect(deveRastrear('amostra', false)).toBe(false)
  })

  it('modo ausente é tratado como amostra (lado seguro)', () => {
    expect(deveRastrear(null, false)).toBe(false)
    expect(deveRastrear(undefined, true)).toBe(true)
  })

  it('modo desconhecido nunca libera todos', () => {
    expect(deveRastrear('TODOS ', false)).toBe(false)
    expect(deveRastrear('qualquer', false)).toBe(false)
  })
})
