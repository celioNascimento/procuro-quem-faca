import { beforeEach, describe, expect, it, vi } from 'vitest'

// Contagens devolvidas, na ordem das consultas da rota: denúncia recente, aviso do perfil, avisos totais
let contagens: number[] = []
const inserir = vi.fn()
const depois: Array<() => Promise<void> | void> = []
const enviarEmail = vi.fn()

function consulta() {
  const resultado = { count: contagens.shift() ?? 0, error: null }
  const cadeia: Record<string, unknown> = {}
  for (const metodo of ['select', 'eq', 'gte']) cadeia[metodo] = () => cadeia
  cadeia.then = (ok: (v: unknown) => unknown) => Promise.resolve(resultado).then(ok)
  return cadeia
}

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (fn: () => Promise<void> | void) => { depois.push(fn) },
}))
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({ from: () => ({ ...consulta(), insert: inserir }) }),
}))
vi.mock('@/lib/notificacoes/email', () => ({ enviarEmail: (...a: unknown[]) => enviarEmail(...a) }))

import { POST } from '@/app/api/notificacoes/denuncia/route'

const chamar = (corpo: unknown) =>
  POST(new Request('http://localhost/api/notificacoes/denuncia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  }))

beforeEach(() => {
  vi.clearAllMocks()
  depois.length = 0
  contagens = []
  inserir.mockResolvedValue({ error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/notificacoes/denuncia', () => {
  it.each([{}, { prestadorId: 'abc' }, { prestadorId: -1 }, { prestadorId: 0 }, '{ruim'])(
    'recusa pedido inválido: %j',
    async (corpo) => {
      expect((await chamar(corpo)).status).toBe(400)
      expect(inserir).not.toHaveBeenCalled()
    },
  )

  it('não envia quando não existe denúncia recente para o perfil (rota não vira disparador de spam)', async () => {
    contagens = [0]
    expect(await (await chamar({ prestadorId: 5 })).json()).toEqual({ ok: true, enviado: false })
    expect(inserir).not.toHaveBeenCalled()
    expect(depois).toHaveLength(0)
  })

  it('não envia de novo para o mesmo perfil dentro do intervalo', async () => {
    contagens = [1, 1]
    expect((await (await chamar({ prestadorId: 5 })).json()).enviado).toBe(false)
    expect(depois).toHaveLength(0)
  })

  it('não envia quando o limite total da janela foi atingido', async () => {
    contagens = [1, 0, 10]
    expect((await (await chamar({ prestadorId: 5 })).json()).enviado).toBe(false)
    expect(depois).toHaveLength(0)
  })

  it('envia uma vez: registra o aviso antes e manda o e-mail sem dado pessoal', async () => {
    contagens = [1, 0, 2]
    const r = await chamar({ prestadorId: 5 })
    expect(await r.json()).toEqual({ ok: true, enviado: true })
    expect(inserir).toHaveBeenCalledWith(expect.objectContaining({ acao: 'EMAIL_DENUNCIA', entidade_id: '5' }))

    await Promise.all(depois.map(fn => fn()))
    expect(enviarEmail).toHaveBeenCalledTimes(1)
  })

  it('falha interna nunca derruba a denúncia: responde sucesso sem enviar', async () => {
    contagens = [1, 0, 0]
    inserir.mockRejectedValue(new Error('banco fora'))
    const r = await chamar({ prestadorId: 5 })
    expect(r.status).toBe(200)
    expect((await r.json()).enviado).toBe(false)
  })
})
