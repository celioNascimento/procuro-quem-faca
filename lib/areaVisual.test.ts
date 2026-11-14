// lib/areaVisual.test.ts
import { describe, expect, it } from 'vitest'
import { visualDaArea } from '@/lib/areaVisual'

describe('visualDaArea', () => {
  it('reconhece os ícones usados nas áreas do catálogo', () => {
    for (const icone of ['sparkles', 'hammer', 'home', 'cpu', 'heart', 'book', 'star']) {
      expect(visualDaArea(icone)?.Icone).toBeTruthy()
    }
  })

  it('ignora maiúsculas e espaços', () => {
    expect(visualDaArea(' Hammer ')).toBe(visualDaArea('hammer'))
  })

  it('ícone vazio ou desconhecido devolve null (o card usa as iniciais)', () => {
    expect(visualDaArea(null)).toBeNull()
    expect(visualDaArea('')).toBeNull()
    expect(visualDaArea('foguete')).toBeNull()
  })
})
