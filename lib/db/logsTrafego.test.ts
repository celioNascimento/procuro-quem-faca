import { beforeEach, describe, expect, it, vi } from 'vitest'

const insert = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) }, from: () => ({ insert }) },
}))

import { insertLogDeTrafego } from '@/lib/db/logs'

function definirNavegador(userAgent: string, webdriver: boolean) {
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent, webdriver }, configurable: true })
}

beforeEach(() => insert.mockClear())

describe('insertLogDeTrafego', () => {
  it('navegador comum: grava', async () => {
    definirNavegador('Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36', false)
    await insertLogDeTrafego({ acao: 'BUSCA_REALIZADA', detalhes: { termo: 'pedreiro' } })
    expect(insert).toHaveBeenCalledTimes(1)
  })
  it('navegador automatizado ou robô: não grava', async () => {
    definirNavegador('Mozilla/5.0 Chrome/130.0 Safari/537.36', true)
    await insertLogDeTrafego({ acao: 'BUSCA_REALIZADA' })
    definirNavegador('Mozilla/5.0 (compatible; Googlebot/2.1)', false)
    await insertLogDeTrafego({ acao: 'VISITA_PERFIL_VIA_BUSCA' })
    expect(insert).not.toHaveBeenCalled()
  })
})
