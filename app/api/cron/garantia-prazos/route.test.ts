import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: () => ({ rpc }) }))

import { GET } from '@/app/api/cron/garantia-prazos/route'

const chamar = (autorizacao?: string) =>
  GET(new Request('http://localhost/api/cron/garantia-prazos', {
    headers: autorizacao ? { authorization: autorizacao } : {},
  }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/cron/garantia-prazos', () => {
  it('sem CRON_SECRET configurado, recusa tudo e não toca no banco', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await chamar('Bearer qualquer')).status).toBe(500)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('sem o segredo certo, responde 401 e não toca no banco', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    expect((await chamar()).status).toBe(401)
    expect((await chamar('Bearer errado')).status).toBe(401)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('chama a função de prazos e conta o que foi tratado', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({
      data: [{ novo_status: 'sem_resposta' }, { novo_status: 'sem_resposta' }, { novo_status: 'recusada' }],
      error: null,
    })
    const r = await chamar('Bearer segredo')
    expect(rpc).toHaveBeenCalledWith('garantia_processar_vencidos')
    expect(await r.json()).toEqual({ ok: true, sem_resposta: 2, ofertas_recusadas: 1 })
  })

  it('sem nada vencido, responde zeros', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({ data: [], error: null })
    expect(await (await chamar('Bearer segredo')).json()).toEqual({ ok: true, sem_resposta: 0, ofertas_recusadas: 0 })
  })

  it('erro do banco vira 500 genérico, sem vazar o motivo', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({ data: null, error: new Error('detalhe interno do banco') })
    const r = await chamar('Bearer segredo')
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toContain('detalhe interno')
  })
})
