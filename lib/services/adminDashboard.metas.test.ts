import { beforeEach, describe, expect, it, vi } from 'vitest'

const chamadas = vi.hoisted(() => ({ selects: [] as { tabela: string; colunas: string }[], filtros: [] as { filtro: string; opcoes?: unknown }[] }))

vi.mock('@/lib/supabase', () => {
  const cadeia = (tabela: string) => {
    const q: Record<string, unknown> = {
      select(colunas: string) { chamadas.selects.push({ tabela, colunas }); return q },
      not: () => q,
      is: () => q,
      or: (filtro: string, opcoes?: unknown) => { chamadas.filtros.push({ filtro, opcoes }); return q },
      then: (ok: (v: unknown) => unknown) => Promise.resolve({ count: tabela === 'prestadores' ? 10 : 1, error: null }).then(ok),
    }
    return q
  }
  return { supabase: { from: (t: string) => cadeia(t) } }
})

import { getMetasDoMes } from './adminDashboard.service'

describe('getMetasDoMes', () => {
  beforeEach(() => { chamadas.selects.length = 0; chamadas.filtros.length = 0 })

  it('devolve as contas e os trabalhos no feed', async () => {
    expect(await getMetasDoMes()).toEqual({ contas: 10, trabalhosNoFeed: 1 })
  })

  it('nunca usa select("*"): o admin não tem permissão em todas as colunas de portfolio_projetos', async () => {
    await getMetasDoMes()
    expect(chamadas.selects.map((c) => c.tabela).sort()).toEqual(['portfolio_projetos', 'prestadores'])
    for (const { colunas } of chamadas.selects) expect(colunas).not.toBe('*')
  })

  it('trabalho de perfil de exemplo não conta na meta (junta com prestadores e filtra exemplo)', async () => {
    await getMetasDoMes()
    const feed = chamadas.selects.find((c) => c.tabela === 'portfolio_projetos')
    expect(feed?.colunas).toContain('prestadores!inner')
    expect(chamadas.filtros).toContainEqual({ filtro: 'exemplo.is.null,exemplo.eq.false', opcoes: { referencedTable: 'prestadores' } })
  })
})
