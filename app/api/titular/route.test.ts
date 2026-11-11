import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const depois: Array<() => Promise<void> | void> = []
const enviarEmail = vi.fn()

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => Promise<void> | void) => { depois.push(fn) },
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ rpc }) }))
vi.mock('@/lib/notificacoes/email', () => ({ enviarEmail: (...a: unknown[]) => enviarEmail(...a) }))

import { POST } from '@/app/api/titular/route'

const pedir = (corpo: unknown, headers: Record<string, string> = {}) =>
  POST(new Request('http://localhost/api/titular', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  }))

const valido = { tipo: 'exclusao', nome: 'Maria', contato: 'maria@exemplo.com', descricao: '', prestadorId: 7 }

beforeEach(() => {
  vi.clearAllMocks()
  depois.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/titular', () => {
  it('registra o pedido no banco e devolve o protocolo', async () => {
    rpc.mockResolvedValue({ data: 'a1b2c3d4-0000-0000-0000-000000000000', error: null })

    const r = await pedir(valido)

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, protocolo: 'A1B2C3D4', prazoDias: 15 })
    expect(rpc).toHaveBeenCalledWith('registrar_solicitacao_titular', {
      p_tipo: 'exclusao', p_nome: 'Maria', p_contato: 'maria@exemplo.com', p_descricao: null, p_prestador_id: 7,
    })
  })

  it('avisa o administrador depois de responder, sem dado pessoal no e-mail', async () => {
    rpc.mockResolvedValue({ data: 'a1b2c3d4-0000-0000-0000-000000000000', error: null })
    await pedir(valido)
    expect(enviarEmail).not.toHaveBeenCalled()

    await Promise.all(depois.map(fn => fn()))

    expect(enviarEmail).toHaveBeenCalledTimes(1)
    const enviado = JSON.stringify(enviarEmail.mock.calls[0][0])
    expect(enviado).toContain('A1B2C3D4')
    expect(enviado).not.toContain('maria@exemplo.com')
    expect(enviado).not.toContain('Maria')
  })

  it('recusa pedido inválido sem tocar no banco', async () => {
    const r = await pedir({ ...valido, contato: 'oi' })
    expect(r.status).toBe(400)
    expect((await r.json()).erros.contato).toBeDefined()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('robô recebe resposta de sucesso, mas nada é gravado nem enviado', async () => {
    const r = await pedir({ ...valido, website: 'http://spam.example' })
    expect(r.status).toBe(200)
    expect(rpc).not.toHaveBeenCalled()
    expect(depois).toHaveLength(0)
  })

  it('corpo que não é JSON vira 400', async () => {
    expect((await pedir('isto não é json')).status).toBe(400)
  })

  it('corpo grande demais vira 413, mesmo sem cabeçalho de tamanho', async () => {
    expect((await pedir({ ...valido, descricao: 'a'.repeat(20_000) })).status).toBe(413)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('limite por contato do banco vira 429', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '54000' } })
    expect((await pedir(valido)).status).toBe(429)
    expect(depois).toHaveLength(0)
  })

  it('perfil que não existe vira 400', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23503' } })
    expect((await pedir(valido)).status).toBe(400)
  })

  it('erro inesperado vira 500 sem vazar detalhes', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'segredo interno' } })
    const r = await pedir(valido)
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toContain('segredo interno')
  })
})
