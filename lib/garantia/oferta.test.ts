import { describe, expect, it } from 'vitest'
import { podeOferecerReparo } from './oferta'

const av = (o: Partial<{ nota: number; indica: boolean | null; oculta_por_garantia: boolean | null }> = {}) =>
  ({ nota: 2, indica: false, oculta_por_garantia: false, ...o })

describe('podeOferecerReparo (espelha garantia_oferecer_reparo)', () => {
  it('avaliação negativa + garantia configurada: pode', () => {
    expect(podeOferecerReparo(av(), 30)).toBe(true)
  })
  it('nota até 3 conta como negativa mesmo indicando', () => {
    expect(podeOferecerReparo(av({ nota: 3, indica: true }), 30)).toBe(true)
  })
  it('não indica conta como negativa mesmo com nota alta', () => {
    expect(podeOferecerReparo(av({ nota: 5, indica: false }), 30)).toBe(true)
  })
  it('avaliação positiva: não pode', () => {
    expect(podeOferecerReparo(av({ nota: 5, indica: true }), 30)).toBe(false)
    expect(podeOferecerReparo(av({ nota: 4, indica: null }), 30)).toBe(false) // indica nulo = indica
  })
  it('sem garantia configurada: não pode', () => {
    expect(podeOferecerReparo(av(), 0)).toBe(false)
    expect(podeOferecerReparo(av(), null)).toBe(false)
    expect(podeOferecerReparo(av(), undefined)).toBe(false)
  })
  it('já resolvida via garantia ou sem avaliação: não pode', () => {
    expect(podeOferecerReparo(av({ oculta_por_garantia: true }), 30)).toBe(false)
    expect(podeOferecerReparo(null, 30)).toBe(false)
  })
})
