import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getUser = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  }),
}))
vi.mock('./lib/supabase/env', () => ({ getSupabasePublicEnv: () => ({ url: 'http://x', anonKey: 'k' }) }))
vi.mock('./lib/tracking/gravarOrigem', () => ({ gravarOrigemSeNecessario: (_r: unknown, resp: unknown) => resp }))

import { proxy } from './proxy'

const pedir = (caminho: string) => proxy(new NextRequest(`http://localhost${caminho}`))

beforeEach(() => vi.clearAllMocks())

describe('proxy: rotas que exigem login', () => {
  it.each(['/painel/perfil', '/dashboard', '/acompanhamento/abc', '/avaliar/abc'])(
    'deslogado em %s vai para /login',
    async (caminho) => {
      getUser.mockResolvedValue({ data: { user: null } })
      const res = await pedir(caminho)
      expect(res.status).toBe(307)
      expect(new URL(res.headers.get('location')!).pathname).toBe('/login')
    },
  )

  it('em /painel/perfil o login volta para a mesma tela (next)', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const res = await pedir('/painel/perfil')
    expect(new URL(res.headers.get('location')!).searchParams.get('next')).toBe('/painel/perfil')
  })

  it('logado em /painel/perfil segue normalmente', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await pedir('/painel/perfil')
    expect(res.headers.get('location')).toBeNull()
  })

  it('páginas públicas não consultam a autenticação', async () => {
    const res = await pedir('/prestadores')
    expect(getUser).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toBeNull()
  })

  it('/meus-servicos continua público (tem a sua própria tela de entrada com Google)', async () => {
    const res = await pedir('/meus-servicos?token=abc')
    expect(getUser).not.toHaveBeenCalled()
    expect(res.headers.get('location')).toBeNull()
  })
})
