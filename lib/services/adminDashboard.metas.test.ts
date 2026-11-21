import { beforeEach, describe, expect, it, vi } from 'vitest'

const chamadas = vi.hoisted(() => ({ selects: [] as { tabela: string; colunas: string }[] }))

vi.mock('@/lib/supabase', () => {
  const cadeia = (tabela: string) => {
    const q: Record<string, unknown> = {
      select(colunas: string) { chamadas.selects.push({ tabela, colunas }); return q },
      not: () => q,
      is: () => q,
      or: () => Promise.resolve({ count: tabela === 'prestadores' ? 10 : 1, error: null }),
    }
    return q
  }
  return { supabase: { from: (t: string) => cadeia(t) } }
})

import { getMetasDoMes } from './adminDashboard.service'

describe('getMetasDoMes', () => {
  beforeEach(() => { chamadas.selects.length = 0 })

  it('devolve as contas e os trabalhos no feed', async () => {
    expect(await getMetasDoMes()).toEqual({ contas: 10, trabalhosNoFeed: 1 })
  })

  it('nunca usa select("*"): o admin não tem permissão em todas as colunas de portfolio_projetos', async () => {
    await getMetasDoMes()
    expect(chamadas.selects.map((c) => c.tabela).sort()).toEqual(['portfolio_projetos', 'prestadores'])
    for (const { colunas } of chamadas.selects) expect(colunas).not.toBe('*')
  })
})
