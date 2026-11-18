import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), upsert: async () => ({ error: null }) }),
  }),
}))
const consultarCnpj = vi.fn()
vi.mock('@/lib/cnpj/consulta', () => ({ consultarCnpj: (...a: unknown[]) => consultarCnpj(...a) }))

import { GET } from '@/app/api/cron/cnpj-reverificacao/route'

const chamar = (autorizacao?: string) =>
  GET(new Request('http://localhost/api/cron/cnpj-reverificacao', {
    headers: autorizacao ? { authorization: autorizacao } : {},
  }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/cron/cnpj-reverificacao', () => {
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

  it('reconsulta, registra o resultado, expira vencidos e limpa o cache', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    consultarCnpj.mockResolvedValue({ ok: true, dados: { situacao: 'ATIVA', fonte: 'brasilapi' } })
    rpc.mockImplementation(async (nome: string) => {
      if (nome === 'cnpj_reverificacao_pendentes') return { data: [{ prestador_id: 7, cnpj: '47403170000180' }], error: null }
      if (nome === 'cnpj_registrar_reverificacao') return { data: 'renovada', error: null }
      if (nome === 'cnpj_expirar_vencidos') return { data: 2, error: null }
      if (nome === 'cnpj_limpar_cache') return { data: 5, error: null }
      return { data: null, error: new Error('rpc inesperada') }
    })
    const r = await chamar('Bearer segredo')
    expect(rpc).toHaveBeenCalledWith('cnpj_registrar_reverificacao', { p_prestador_id: 7, p_situacao: 'ATIVA', p_fonte: 'brasilapi' })
    expect(await r.json()).toEqual({
      ok: true, analisados: 1, renovados: 1, selosPausados: 0, ignorados: 0, semResposta: 0, erros: 0, parouPor: null,
      expirados: 2, cacheLimpo: 5,
    })
  })

  it('erro do banco vira 500 genérico, sem vazar o motivo', async () => {
    vi.stubEnv('CRON_SECRET', 'segredo')
    rpc.mockResolvedValue({ data: null, error: new Error('detalhe interno do banco') })
    const r = await chamar('Bearer segredo')
    expect(r.status).toBe(500)
    expect(JSON.stringify(await r.json())).not.toContain('detalhe interno')
  })
})
