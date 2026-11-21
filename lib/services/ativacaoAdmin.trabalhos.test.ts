import { beforeEach, describe, expect, it, vi } from 'vitest'

const chamadas = vi.hoisted(() => ({ colunas: [] as string[], linhas: [] as unknown[] }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select(colunas: string) { chamadas.colunas.push(colunas); return this },
      order() { return this },
      range: () => Promise.resolve({ data: chamadas.linhas, error: null }),
    }),
  },
}))

import { listarTrabalhosDosPrestadores } from './ativacaoAdmin.service'

describe('listarTrabalhosDosPrestadores', () => {
  beforeEach(() => { chamadas.colunas.length = 0; chamadas.linhas = [] })

  it('devolve as linhas lidas', async () => {
    chamadas.linhas = [{ id: 'a', prestador_id: 1 }]
    expect(await listarTrabalhosDosPrestadores()).toEqual([{ id: 'a', prestador_id: 1 }])
  })

  it('nunca usa select("*") em portfolio_projetos (o admin não pode ler todas as colunas)', async () => {
    await listarTrabalhosDosPrestadores()
    expect(chamadas.colunas).toHaveLength(1)
    expect(chamadas.colunas[0]).not.toBe('*')
    expect(chamadas.colunas[0]).not.toMatch(/cliente_(nome|whatsapp)|avaliacao_token/)
  })
})
