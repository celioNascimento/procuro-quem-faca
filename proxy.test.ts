import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getUser = vi.fn()
const nivel = vi.fn()
const perfilAdmin = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser, mfa: { getAuthenticatorAssuranceLevel: nivel } },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: perfilAdmin() }) }) }) }),
  }),
}))
vi.mock('./lib/supabase/env', () => ({ getSupabasePublicEnv: () => ({ url: 'http://x', anonKey: 'k' }) }))
vi.mock('./lib/tracking/gravarOrigem', () => ({ gravarOrigemSeNecessario: (_r: unknown, resp: unknown) => resp }))

import { proxy } from './proxy'

const pedir = (caminho: string) => proxy(new NextRequest(`http://localhost${caminho}`))

beforeEach(() => { vi.clearAllMocks(); perfilAdmin.mockReturnValue(null) })

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

describe('proxy: painel admin com verificação em duas etapas', () => {
  const admin = () => {
    getUser.mockResolvedValue({ data: { user: { id: 'a1' } } })
    perfilAdmin.mockReturnValue({ role: 'owner' })
  }

  it('admin sem segundo fator cadastrado só vê a tela de cadastro (Segurança da conta)', async () => {
    admin()
    nivel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null })
    const res = await pedir('/admin/feed')
    const destino = new URL(res.headers.get('location')!)
    expect(destino.pathname).toBe('/admin/seguranca')
    expect(destino.searchParams.get('obrigatorio')).toBe('1')
  })

  it('a tela de cadastro abre para quem ainda não tem o segundo fator (sem laço de redirecionamento)', async () => {
    admin()
    nivel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null })
    const res = await pedir('/admin/seguranca?obrigatorio=1')
    expect(res.headers.get('location')).toBeNull()
  })

  it('admin com segundo fator e sem o código volta para o login', async () => {
    admin()
    nivel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null })
    const res = await pedir('/admin/feed')
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin/login')
  })

  it('admin que já digitou o código entra no painel', async () => {
    admin()
    nivel.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null })
    const res = await pedir('/admin/feed')
    expect(res.headers.get('location')).toBeNull()
  })

  it('erro ao consultar o nível de acesso não abre o painel', async () => {
    admin()
    nivel.mockResolvedValue({ data: null, error: new Error('falha') })
    const res = await pedir('/admin/feed')
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin/login')
  })

  it('no login, quem falta digitar o código fica na tela (sem laço de redirecionamento)', async () => {
    admin()
    nivel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null })
    const res = await pedir('/admin/login')
    expect(res.headers.get('location')).toBeNull()
  })

  it('no login, quem já provou o código vai para o painel', async () => {
    admin()
    nivel.mockResolvedValue({ data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null })
    const res = await pedir('/admin/login')
    expect(new URL(res.headers.get('location')!).pathname).toBe('/admin')
  })
})
