import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { validarAdminNaApi } from './adminServidor'

function cliente(opts: { user?: unknown; admin?: unknown; nivel?: { data: unknown; error: unknown } }) {
  return {
    auth: {
      getUser: async () => ({ data: { user: opts.user ?? null } }),
      mfa: { getAuthenticatorAssuranceLevel: vi.fn(async () => opts.nivel ?? { data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null }) },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: opts.admin ?? null }) }) }) }),
  } as unknown as SupabaseClient
}

describe('validarAdminNaApi', () => {
  it('sem login: 401', async () => {
    const r = await validarAdminNaApi(cliente({}))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.resposta.status).toBe(401)
  })

  it('logado, mas não admin: 403', async () => {
    const r = await validarAdminNaApi(cliente({ user: { id: 'u1' } }))
    expect(!r.ok && r.resposta.status).toBe(403)
  })

  it('admin com segundo fator e sem o código: 403', async () => {
    const r = await validarAdminNaApi(cliente({ user: { id: 'u1' }, admin: { user_id: 'u1' }, nivel: { data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null } }))
    expect(!r.ok && r.resposta.status).toBe(403)
  })

  it('erro ao consultar o nível de acesso: 403', async () => {
    const r = await validarAdminNaApi(cliente({ user: { id: 'u1' }, admin: { user_id: 'u1' }, nivel: { data: null, error: new Error('x') } }))
    expect(!r.ok && r.resposta.status).toBe(403)
  })

  it('admin sem segundo fator cadastrado, ou com o código provado: libera', async () => {
    const semFator = await validarAdminNaApi(cliente({ user: { id: 'u1' }, admin: { user_id: 'u1' } }))
    expect(semFator).toEqual({ ok: true, userId: 'u1' })
    const comCodigo = await validarAdminNaApi(cliente({ user: { id: 'u1' }, admin: { user_id: 'u1' }, nivel: { data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null } }))
    expect(comCodigo.ok).toBe(true)
  })
})
