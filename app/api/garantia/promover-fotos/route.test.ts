import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  user: { id: 'cliente-1' } as { id: string } | null,
  caso: { id: '', status: 'resolvida', cliente_user_id: 'cliente-1' } as Record<string, unknown> | null,
  fotos: [] as { id: string; url_foto: string }[],
  baixados: [] as string[],
  publicados: [] as string[],
  adminCriado: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: h.caso }) }) }) }),
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => {
    h.adminCriado()
    return {
      from: () => {
        const q: Record<string, unknown> = {}
        q.select = () => q
        q.eq = () => q
        q.update = () => ({ eq: async () => ({ error: null }) })
        q.then = (ok: (v: unknown) => unknown) => ok({ data: h.fotos, error: null })
        return q
      },
      storage: {
        from: (bucket: string) => ({
          download: async (p: string) => { h.baixados.push(p); return { data: new Blob(['x']), error: null } },
          upload: async (p: string) => { if (bucket === 'garantia-publico') h.publicados.push(p); return { error: null } },
          getPublicUrl: (p: string) => ({ data: { publicUrl: `https://pub/${p}` } }),
        }),
      },
    }
  },
}))

import { POST } from './route'

const CASO = '11111111-1111-1111-1111-111111111111'
const OUTRO = '22222222-2222-2222-2222-222222222222'
const pedido = (corpo: unknown) => new Request('http://x/api/garantia/promover-fotos', { method: 'POST', body: JSON.stringify(corpo) }) as never

describe('POST /api/garantia/promover-fotos', () => {
  beforeEach(() => {
    h.user = { id: 'cliente-1' }
    h.caso = { id: CASO, status: 'resolvida', cliente_user_id: 'cliente-1' }
    h.fotos = [{ id: 'f1', url_foto: `${CASO}/a.jpg` }]
    h.baixados = []; h.publicados = []; h.adminCriado.mockClear()
  })

  it('sem login: nega e nem chega a usar a chave administrativa', async () => {
    h.user = null
    const r = await POST(pedido({ casoId: CASO }))
    expect(r.status).toBe(404)
    expect(h.adminCriado).not.toHaveBeenCalled()
  })

  it('logado mas não é o cliente do caso: nega', async () => {
    h.user = { id: 'outra-pessoa' }
    expect((await POST(pedido({ casoId: CASO }))).status).toBe(404)
    expect(h.adminCriado).not.toHaveBeenCalled()
  })

  it('caso ainda não resolvido: nega (foto de caso aberto não vira pública)', async () => {
    h.caso = { id: CASO, status: 'respondida', cliente_user_id: 'cliente-1' }
    expect((await POST(pedido({ casoId: CASO }))).status).toBe(404)
    expect(h.adminCriado).not.toHaveBeenCalled()
  })

  it('caso inexistente (ou invisível pelas regras do banco): mesma resposta, sem pista', async () => {
    h.caso = null
    expect((await POST(pedido({ casoId: CASO }))).status).toBe(404)
  })

  it('id que não é um código válido: 400', async () => {
    expect((await POST(pedido({ casoId: "x'; drop" }))).status).toBe(400)
    expect((await POST(pedido({}))).status).toBe(400)
  })

  it('cliente do caso resolvido: promove a foto da pasta do caso', async () => {
    const r = await POST(pedido({ casoId: CASO }))
    expect(await r.json()).toEqual({ promovidas: 1, falhas: 0 })
    expect(h.publicados).toEqual([`${CASO}/a.jpg`])
  })

  it('foto que aponta para arquivo de OUTRO caso não é copiada', async () => {
    h.fotos = [{ id: 'f1', url_foto: `${OUTRO}/segredo.jpg` }, { id: 'f2', url_foto: `${CASO}/ok.jpg` }]
    const r = await POST(pedido({ casoId: CASO }))
    expect(await r.json()).toEqual({ promovidas: 1, falhas: 1 })
    expect(h.baixados).toEqual([`${CASO}/ok.jpg`])
    expect(h.publicados).toEqual([`${CASO}/ok.jpg`])
  })
})
