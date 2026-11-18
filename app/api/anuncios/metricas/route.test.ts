import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getUser = vi.fn()
const maybeSingle = vi.fn()
const lerMetricas = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ gte: () => ({ order: lerMetricas }) }) }),
  }),
}))
vi.mock('@/lib/services/anunciosMetricas.service', () => ({ incrementarMetricaAnuncio: vi.fn() }))

import { GET } from '@/app/api/anuncios/metricas/route'

const pedir = () => GET(new NextRequest('http://localhost/api/anuncios/metricas?dataInicio=2026-11-01'))

beforeEach(() => {
  vi.clearAllMocks()
  lerMetricas.mockResolvedValue({ data: [{ anuncio_id: 1 }], error: null })
})

describe('GET /api/anuncios/metricas (só admin)', () => {
  it('sem login: 401 e não lê nada', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const res = await pedir()
    expect(res.status).toBe(401)
    expect(lerMetricas).not.toHaveBeenCalled()
  })

  it('logado mas não admin: 403 e não lê nada', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    maybeSingle.mockResolvedValue({ data: null })
    const res = await pedir()
    expect(res.status).toBe(403)
    expect(lerMetricas).not.toHaveBeenCalled()
  })

  it('admin: 200 com as métricas', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    maybeSingle.mockResolvedValue({ data: { user_id: 'u1' } })
    const res = await pedir()
    expect(res.status).toBe(200)
    expect((await res.json()).data).toHaveLength(1)
  })
})
