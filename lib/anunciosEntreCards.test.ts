// lib/anunciosEntreCards.test.ts
import { describe, it, expect } from 'vitest'
import { aleatorioEstavel, chavePracaDe, ehPosicaoDeAnuncio, posicaoTemAnuncio } from '@/lib/anunciosEntreCards'

describe('posições de anúncio', () => {
  it('um anúncio depois de cada 4 cards', () => {
    expect([0, 1, 2, 3, 4, 7, 8].map(ehPosicaoDeAnuncio)).toEqual([false, false, false, true, false, true, false])
  })

  it('chave da praça precisa de cidade e categoria', () => {
    expect(chavePracaDe({ cidade_id: 'a', categoria_id: 'b' })).toBe('a::b')
    expect(chavePracaDe({ cidade_id: 'a', categoria_id: '' })).toBeNull()
  })
})

describe('posicaoTemAnuncio', () => {
  const base = { ocupados: 3, vagasTotais: 4, chave: 'c1::k1', semente: 0.42 }

  it('sem anunciante na praça, nunca mostra', () => {
    expect(posicaoTemAnuncio({ ...base, ocupados: 0, indiceNaPraca: 0 })).toBe(false)
    expect(posicaoTemAnuncio({ ...base, vagasTotais: 0, indiceNaPraca: 0 })).toBe(false)
  })

  it('a primeira posição da praça sempre mostra quando há anunciante', () => {
    expect(posicaoTemAnuncio({ ...base, indiceNaPraca: 0 })).toBe(true)
  })

  it('a decisão de cada posição é a mesma toda vez (não muda ao carregar mais)', () => {
    const a = [1, 2, 3, 4, 5].map(i => posicaoTemAnuncio({ ...base, indiceNaPraca: i }))
    const b = [1, 2, 3, 4, 5].map(i => posicaoTemAnuncio({ ...base, indiceNaPraca: i }))
    expect(a).toEqual(b)
  })

  it('na média respeita a taxa mínima de 65%', () => {
    const total = 2000
    let mostrou = 0
    for (let i = 1; i <= total; i++) {
      if (posicaoTemAnuncio({ ocupados: 1, vagasTotais: 100, indiceNaPraca: i, chave: 'x::y', semente: 0.1 })) mostrou++
    }
    expect(mostrou / total).toBeGreaterThan(0.6)
    expect(mostrou / total).toBeLessThan(0.72)
  })

  it('aleatorioEstavel fica entre 0 e 1', () => {
    for (let i = 0; i < 100; i++) {
      const v = aleatorioEstavel(`k${i}`, 0.3)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
