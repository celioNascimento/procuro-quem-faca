import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const notificar = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: () => ({ rpc }) }))
vi.mock('@/lib/notificacoes/garantiaEnvio', () => ({ notificarGarantia: (...a: unknown[]) => notificar(...a) }))

import { GET } from '@/app/api/cron/garantia-vencidos/route'

const chamar = (autorizacao?: string) =>
  GET(new Request('http://localhost/api/cron/garantia-vencidos', { headers: autorizacao ? { authorization: autorizacao } : {} }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/cron/garantia-vencidos', () => {
  it('sem CRON_SECRET recusa tudo', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await chamar('Bearer x')).status).toBe(500)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('segredo errado → 401 e não processa nada', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    expect((await chamar()).status).toBe(401)
    expect((await chamar('Bearer errado')).status).toBe(401)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('processa e avisa cliente e prestador de cada caso encerrado', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({
      data: [
        { caso_id: 'a', prestador_id: 1, cliente_user_id: 'c1', novo_status: 'sem_resposta' },
        { caso_id: 'b', prestador_id: 2, cliente_user_id: 'c2', novo_status: 'recusada' },
      ],
      error: null,
    })
    const r = await chamar('Bearer segredo')
    expect(await r.json()).toEqual({ ok: true, sem_resposta: 1, ofertas_expiradas: 1 })
    expect(rpc).toHaveBeenCalledWith('garantia_processar_vencidos')
    expect(notificar).toHaveBeenCalledTimes(4)
    expect(notificar).toHaveBeenCalledWith('sem_resposta', 'cliente', { prestador_id: 1, cliente_user_id: 'c1' })
    expect(notificar).toHaveBeenCalledWith('oferta_expirada', 'prestador', { prestador_id: 2, cliente_user_id: 'c2' })
  })

  it('sem casos vencidos, não avisa ninguém', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({ data: [], error: null })
    expect(await (await chamar('Bearer segredo')).json()).toEqual({ ok: true, sem_resposta: 0, ofertas_expiradas: 0 })
    expect(notificar).not.toHaveBeenCalled()
  })

  it('falha do banco vira 500 sem detalhe', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({ data: null, error: new Error('boom interno') })
    const r = await chamar('Bearer segredo')
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toContain('boom')
  })
})
