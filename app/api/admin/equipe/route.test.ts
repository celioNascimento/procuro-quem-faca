import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const m = vi.hoisted(() => ({ validar: vi.fn(), rpc: vi.fn(), convidar: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ rpc: m.rpc }) }))
vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: () => ({ auth: { admin: { inviteUserByEmail: m.convidar } } }) }))
vi.mock('@/lib/auth/adminServidor', () => ({ validarAdminNaApi: m.validar }))

import { POST } from './route'

const pedir = (corpo: unknown) =>
  POST(new NextRequest('https://pqf.test/api/admin/equipe', { method: 'POST', body: JSON.stringify(corpo), headers: { 'content-type': 'application/json' } }))

beforeEach(() => {
  vi.clearAllMocks()
  m.validar.mockResolvedValue({ ok: true, userId: 'a1' })
})

describe('POST /api/admin/equipe', () => {
  it('quem não é admin (ou falta o código das duas etapas) é barrado antes de tudo', async () => {
    m.validar.mockResolvedValue({ ok: false, resposta: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) })
    const res = await pedir({ email: 'a@x.com' })
    expect(res.status).toBe(403)
    expect(m.rpc).not.toHaveBeenCalled()
    expect(m.convidar).not.toHaveBeenCalled()
  })

  it('pessoa com conta entra direto pela função do banco', async () => {
    m.rpc.mockResolvedValue({ data: 'ok', error: null })
    const res = await pedir({ email: 'a@x.com' })
    expect(await res.json()).toEqual({ codigo: 'ok', convidado: false })
    expect(m.rpc).toHaveBeenCalledWith('admin_equipe_adicionar', { p_email: 'a@x.com' })
    expect(m.convidar).not.toHaveBeenCalled()
  })

  it('sem conta: convida por e-mail apontando para a tela de criar senha e adiciona', async () => {
    m.rpc.mockResolvedValueOnce({ data: 'sem_conta', error: null }).mockResolvedValueOnce({ data: 'ok', error: null })
    m.convidar.mockResolvedValue({ error: null })
    const res = await pedir({ email: 'nova@x.com' })
    expect(await res.json()).toEqual({ codigo: 'ok', convidado: true })
    expect(m.convidar).toHaveBeenCalledWith('nova@x.com', { redirectTo: 'https://pqf.test/recuperar-senha' })
  })

  it('corpo sem e-mail: código de e-mail inválido, sem tocar no banco', async () => {
    const res = await pedir({})
    expect(await res.json()).toEqual({ codigo: 'email_invalido', convidado: false })
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it('limite de e-mails vira 429 com mensagem simples; erro inesperado vira 500 sem vazar detalhes', async () => {
    m.rpc.mockResolvedValue({ data: 'sem_conta', error: null })
    m.convidar.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } })
    const limite = await pedir({ email: 'nova@x.com' })
    expect(limite.status).toBe(429)

    m.rpc.mockResolvedValue({ data: null, error: new Error('segredo do banco') })
    const falha = await pedir({ email: 'nova@x.com' })
    expect(falha.status).toBe(500)
    expect(JSON.stringify(await falha.json())).not.toContain('segredo')
  })
})
