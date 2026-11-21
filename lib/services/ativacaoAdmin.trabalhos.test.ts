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

import { listarTrabalhosPorPrestador } from './ativacaoAdmin.service'

describe('listarTrabalhosPorPrestador', () => {
  beforeEach(() => { chamadas.colunas.length = 0; chamadas.linhas = [] })

  it('marca quem publicou e quem tem trabalho aceito e ainda no ar no feed', async () => {
    chamadas.linhas = [
      { prestador_id: 1, feed_aceito_em: null, feed_revogado_em: null, feed_oculto: false },
      { prestador_id: 2, feed_aceito_em: '2026-11-20T12:00:00Z', feed_revogado_em: null, feed_oculto: false },
      { prestador_id: 3, feed_aceito_em: '2026-11-20T12:00:00Z', feed_revogado_em: '2026-11-21T12:00:00Z', feed_oculto: false },
      { prestador_id: 4, feed_aceito_em: '2026-11-20T12:00:00Z', feed_revogado_em: null, feed_oculto: true },
      { prestador_id: 1, feed_aceito_em: '2026-11-20T12:00:00Z', feed_revogado_em: null, feed_oculto: null },
    ]
    expect(await listarTrabalhosPorPrestador()).toEqual({
      1: { publicou: true, noFeed: true },
      2: { publicou: true, noFeed: true },
      3: { publicou: true, noFeed: false },
      4: { publicou: true, noFeed: false },
    })
  })

  it('nunca usa select("*") em portfolio_projetos (o admin não pode ler todas as colunas)', async () => {
    await listarTrabalhosPorPrestador()
    expect(chamadas.colunas).toHaveLength(1)
    expect(chamadas.colunas[0]).not.toBe('*')
    expect(chamadas.colunas[0]).not.toMatch(/cliente_|avaliacao_token/)
  })
})
