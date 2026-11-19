import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const getUserById = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: () => ({ rpc, auth: { admin: { getUserById } } }) }))
const enviarEmail = vi.fn()
vi.mock('@/lib/notificacoes/email', () => ({ enviarEmail: (...a: unknown[]) => enviarEmail(...a) }))

import { GET } from '@/app/api/cron/verificacoes-vencimento/route'

const chamar = (autorizacao?: string) =>
  GET(new Request('http://localhost/api/cron/verificacoes-vencimento', { headers: autorizacao ? { authorization: autorizacao } : {} }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/cron/verificacoes-vencimento', () => {
  it('sem CRON_SECRET recusa (500); sem o segredo certo, 401; nada toca no banco', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await chamar('Bearer x')).status).toBe(500)
    vi.stubEnv('CRON_SECRET', 'segredo')
    expect((await chamar()).status).toBe(401)
    expect((await chamar('Bearer errado')).status).toBe(401)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('expira, avisa por e-mail e só marca o aviso quando o e-mail saiu', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockImplementation(async (nome: string) => {
      if (nome === 'verificacoes_expirar') return { data: 2, error: null }
      if (nome === 'verificacoes_a_avisar') {
        return { data: [
          { verificacao_id: 'v1', user_id: 'u1', tipo: 'seguro', dias: 30 },
          { verificacao_id: 'v2', user_id: 'u2', tipo: 'cnd', dias: 3 },
          { verificacao_id: 'v3', user_id: 'u3', tipo: 'cnd', dias: 15 },
        ], error: null }
      }
      return { data: null, error: null }
    })
    getUserById.mockImplementation(async (id: string) => ({ data: { user: { email: id === 'u3' ? null : `${id}@x.com` } } }))
    enviarEmail.mockResolvedValueOnce({ enviado: true }).mockResolvedValueOnce({ enviado: false, motivo: 'sem_chave' })

    const corpo = await (await chamar('Bearer segredo')).json()
    expect(corpo).toEqual({ ok: true, expiradas: 2, avisados: 1, sem_email: 1 })
    expect(enviarEmail.mock.calls[0][0].assunto).toBe('Seu selo de seguro vence em 30 dias')
    expect(enviarEmail.mock.calls[0][2]).toBe('u1@x.com')
    expect(rpc).toHaveBeenCalledWith('verificacoes_marcar_aviso', { p_verificacao_id: 'v1', p_dias: 30 })
    expect(rpc).not.toHaveBeenCalledWith('verificacoes_marcar_aviso', { p_verificacao_id: 'v2', p_dias: 3 })
  })

  it('erro do banco vira 500 genérico', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({ data: null, error: new Error('segredo do banco') })
    const r = await chamar('Bearer segredo')
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toContain('segredo do banco')
  })
})
