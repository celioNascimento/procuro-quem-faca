import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/db/logs', () => ({ insertLog: vi.fn() }))

import { escolherFotosPortfolio } from './divulgacao.service'

describe('escolherFotosPortfolio', () => {
  it('pega a primeira foto (menor ordem) de cada projeto, até o máximo', () => {
    const projetos = [
      { id: 'a', portfolio_fotos: [{ url_foto: 'a2', ordem: 2 }, { url_foto: 'a1', ordem: 1 }] },
      { id: 'b', portfolio_fotos: [] },
      { id: 'c', portfolio_fotos: [{ url_foto: 'c1', ordem: 0 }] },
      { id: 'd', portfolio_fotos: [{ url_foto: null, ordem: 0 }, { url_foto: 'd1', ordem: 1 }] },
    ]
    expect(escolherFotosPortfolio(projetos, 3)).toEqual(['a1', 'c1', 'd1'])
    expect(escolherFotosPortfolio(projetos, 2)).toEqual(['a1', 'c1'])
  })
})
