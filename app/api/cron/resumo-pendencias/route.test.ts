import { beforeEach, describe, expect, it, vi } from 'vitest'

const contar = vi.fn()
const enviarEmail = vi.fn()

vi.mock('@/lib/services/pendenciasServidor.service', () => ({ contarPendenciasServidor: () => contar() }))
vi.mock('@/lib/notificacoes/email', () => ({ enviarEmail: (...a: unknown[]) => enviarEmail(...a) }))

import { GET } from '@/app/api/cron/resumo-pendencias/route'

const zeros = { titular_abertas: 0, titular_atrasadas: 0, denuncias_abertas: 0, garantias_abertas: 0, contestacoes_abertas: 0 }
const chamar = (autorizacao?: string) =>
  GET(new Request('http://localhost/api/cron/resumo-pendencias', {
    headers: autorizacao ? { authorization: autorizacao } : {},
  }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/cron/resumo-pendencias', () => {
  it('sem CRON_SECRET configurado, recusa tudo', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await chamar('Bearer qualquer')).status).toBe(500)
    expect(contar).not.toHaveBeenCalled()
  })

  it('sem o segredo certo, responde 401 e não consulta nada', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    expect((await chamar()).status).toBe(401)
    expect((await chamar('Bearer errado')).status).toBe(401)
    expect(contar).not.toHaveBeenCalled()
  })

  it('sem pendências, não envia e-mail', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    contar.mockResolvedValue(zeros)
    const r = await chamar('Bearer segredo')
    expect(await r.json()).toEqual({ ok: true, total: 0, enviado: false })
    expect(enviarEmail).not.toHaveBeenCalled()
  })

  it('com pendências, envia o resumo', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    contar.mockResolvedValue({ ...zeros, titular_abertas: 1, denuncias_abertas: 2 })
    enviarEmail.mockResolvedValue({ enviado: true })
    const r = await chamar('Bearer segredo')
    expect(await r.json()).toEqual({ ok: true, total: 3, enviado: true })
    expect(enviarEmail).toHaveBeenCalledTimes(1)
  })

  it('e-mail sem chave configurada aparece no retorno, sem erro', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    contar.mockResolvedValue({ ...zeros, denuncias_abertas: 1 })
    enviarEmail.mockResolvedValue({ enviado: false, motivo: 'sem_chave' })
    const r = await chamar('Bearer segredo')
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, total: 1, enviado: false, motivo: 'sem_chave' })
  })

  it('falha ao contar vira 500 sem vazar detalhes', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    contar.mockRejectedValue(new Error('segredo interno do banco'))
    const r = await chamar('Bearer segredo')
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toContain('segredo interno')
  })
})
