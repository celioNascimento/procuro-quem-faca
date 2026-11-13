import { describe, expect, it } from 'vitest'
import { fotosRestantes, MAX_FOTOS_VITRINE, normalizarVitrine, TITULO_PADRAO_VITRINE, tituloDaVitrine } from '@/lib/vitrine/vitrine'

describe('normalizarVitrine', () => {
  it('limita a 5 fotos e descarta valores vazios', () => {
    const fotos = ['a', '', '  ', null, undefined, 'b', 'c', 'd', 'e', 'f', 'g']
    expect(normalizarVitrine({ titulo: 'Meus bolos', fotos }).fotos).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('tira espaços do título e corta em 60 letras', () => {
    expect(normalizarVitrine({ titulo: '  Meu espaço  ', fotos: [] }).titulo).toBe('Meu espaço')
    expect(normalizarVitrine({ titulo: 'x'.repeat(100), fotos: [] }).titulo).toHaveLength(60)
  })

  it('aceita entrada vazia sem quebrar', () => {
    expect(normalizarVitrine({})).toEqual({ titulo: '', fotos: [] })
    expect(normalizarVitrine({ titulo: null, fotos: null })).toEqual({ titulo: '', fotos: [] })
  })
})

describe('tituloDaVitrine', () => {
  it('usa o título escrito ou o padrão', () => {
    expect(tituloDaVitrine('Conheça meu espaço')).toBe('Conheça meu espaço')
    expect(tituloDaVitrine('  ')).toBe(TITULO_PADRAO_VITRINE)
    expect(tituloDaVitrine(null)).toBe(TITULO_PADRAO_VITRINE)
    expect(tituloDaVitrine(undefined)).toBe(TITULO_PADRAO_VITRINE)
  })
})

describe('fotosRestantes', () => {
  it('conta quantas fotos ainda cabem, sem ficar negativo', () => {
    expect(fotosRestantes([])).toBe(MAX_FOTOS_VITRINE)
    expect(fotosRestantes(['a', 'b'])).toBe(3)
    expect(fotosRestantes(['a', 'b', 'c', 'd', 'e', 'f'])).toBe(0)
  })
})
