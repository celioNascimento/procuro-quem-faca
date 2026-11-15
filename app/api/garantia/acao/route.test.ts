import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const rpc = vi.fn()
const notificar = vi.fn()

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser }, rpc }) }))
vi.mock('@/lib/notificacoes/garantiaEnvio', () => ({ notificarGarantia: (...a: unknown[]) => notificar(...a) }))

import { POST } from '@/app/api/garantia/acao/route'

const ID = '5cea4c9b-7acd-4465-a221-5069bd270b98'
const pedir = (corpo: unknown) =>
  POST(new Request('http://localhost/api/garantia/acao', { method: 'POST', body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
})

describe('POST /api/garantia/acao', () => {
  it('corpo que não é JSON → 400, sem tocar no banco', async () => {
    expect((await pedir('{quebrado')).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('pedido inválido → 400, sem tocar no banco', async () => {
    expect((await pedir({ acao: 'responder', casoId: 'x' })).status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('sem login → 401, sem tocar no banco', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    expect((await pedir({ acao: 'reabrir', casoId: ID })).status).toBe(401)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('sucesso: chama a função do banco com a sessão e avisa o outro lado', async () => {
    const caso = { id: ID, prestador_id: 7, cliente_user_id: 'c1', tipo: 'garantia', status: 'aberta' }
    rpc.mockResolvedValue({ data: caso, error: null })
    const r = await pedir({ acao: 'abrir', projetoId: ID, texto: 'x'.repeat(25) })
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual(caso)
    expect(rpc).toHaveBeenCalledWith('garantia_abrir_caso', { p_projeto_id: ID, p_descricao: 'x'.repeat(25) })
    expect(notificar).toHaveBeenCalledWith('aberto', 'prestador', caso)
  })

  it('aviso vai para o lado certo em cada ação', async () => {
    rpc.mockResolvedValue({ data: { id: ID, prestador_id: 7, cliente_user_id: 'c1' }, error: null })
    await pedir({ acao: 'responder', casoId: ID, texto: 'ok' })
    await pedir({ acao: 'aceitar', casoId: ID })
    expect(notificar.mock.calls.map((c) => [c[0], c[1]])).toEqual([
      ['respondido', 'cliente'],
      ['aceita', 'prestador'],
    ])
  })

  it('regra do banco (P0001) volta como 400 com a mensagem em português', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'Já existe um caso em andamento para este serviço.' } })
    const r = await pedir({ acao: 'abrir', projetoId: ID, texto: 'x'.repeat(25) })
    expect(r.status).toBe(400)
    expect((await r.json()).error).toBe('Já existe um caso em andamento para este serviço.')
    expect(notificar).not.toHaveBeenCalled()
  })

  it('erro interno do banco não vaza detalhe', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied for table x' } })
    const r = await pedir({ acao: 'reabrir', casoId: ID })
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toContain('permission denied')
  })
})
