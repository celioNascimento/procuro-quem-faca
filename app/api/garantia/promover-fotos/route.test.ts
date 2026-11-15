import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const maybeSingle = vi.fn()
const adminFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: () => ({ from: adminFrom, storage: {} }) }))

import { POST } from '@/app/api/garantia/promover-fotos/route'

const ID = '5cea4c9b-7acd-4465-a221-5069bd270b98'
const pedir = (corpo: unknown) =>
  POST(new Request('http://localhost/api/garantia/promover-fotos', { method: 'POST', body: JSON.stringify(corpo) }) as never)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  getUser.mockResolvedValue({ data: { user: { id: 'c1' } } })
})

describe('POST /api/garantia/promover-fotos', () => {
  it('casoId inválido → 400', async () => {
    expect((await pedir({ casoId: 'x' })).status).toBe(400)
    expect((await pedir({})).status).toBe(400)
  })

  it('sem login → 401 e não usa a chave de administrador', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect((await pedir({ casoId: ID })).status).toBe(401)
    expect(adminFrom).not.toHaveBeenCalled()
  })

  it('caso de outra pessoa (ou que ela não enxerga) → 404', async () => {
    maybeSingle.mockResolvedValue({ data: null })
    expect((await pedir({ casoId: ID })).status).toBe(404)
    maybeSingle.mockResolvedValue({ data: { id: ID, status: 'resolvida', cliente_user_id: 'outro' } })
    expect((await pedir({ casoId: ID })).status).toBe(404)
    expect(adminFrom).not.toHaveBeenCalled()
  })

  it('caso ainda não resolvido → 409', async () => {
    maybeSingle.mockResolvedValue({ data: { id: ID, status: 'respondida', cliente_user_id: 'c1' } })
    expect((await pedir({ casoId: ID })).status).toBe(409)
    expect(adminFrom).not.toHaveBeenCalled()
  })

  it('cliente do caso resolvido → busca as fotos de resolução ainda privadas', async () => {
    maybeSingle.mockResolvedValue({ data: { id: ID, status: 'resolvida', cliente_user_id: 'c1' } })
    const eq3 = vi.fn().mockResolvedValue({ data: [], error: null })
    const eq2 = vi.fn(() => ({ eq: eq3 }))
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    adminFrom.mockReturnValue({ select: () => ({ eq: eq1 }) })
    const r = await pedir({ casoId: ID })
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ promovidas: 0 })
    expect(adminFrom).toHaveBeenCalledWith('garantia_fotos')
  })
})
