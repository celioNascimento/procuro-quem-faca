import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/db/logs', () => ({ insertLog: vi.fn() }))

import { escolherFotosPortfolio } from './divulgacao.service'

describe('escolherFotosPortfolio', () => {
  it('pega a foto final (maior ordem) de cada projeto, até o máximo', () => {
    const projetos = [
      { id: 'a', portfolio_fotos: [{ url_foto: 'a3', ordem: 3 }, { url_foto: 'a1', ordem: 1 }] },
      { id: 'b', portfolio_fotos: [] },
      { id: 'c', portfolio_fotos: [{ url_foto: 'c1', ordem: 1 }] },
      { id: 'd', portfolio_fotos: [{ url_foto: null, ordem: 3 }, { url_foto: 'd2', ordem: 2 }] },
    ]
    expect(escolherFotosPortfolio(projetos, 3)).toEqual(['a3', 'c1', 'd2'])
    expect(escolherFotosPortfolio(projetos, 2)).toEqual(['a3', 'c1'])
  })
})
