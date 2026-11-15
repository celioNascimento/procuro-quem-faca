import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const estado = vi.hoisted(() => ({
  valor: { session: null, role: null, prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() } as Record<string, unknown>,
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => estado.valor }))
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }))

import { HeaderAuthButton } from '@/components/HeaderAuthButton'

const sessao = { user: { id: 'u1', user_metadata: {} } }

describe('HeaderAuthButton', () => {
  afterEach(() => cleanup())

  it('cliente vê só o acesso à conta, sem atalho para o painel profissional', () => {
    estado.valor = { session: sessao, role: 'cliente', prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getByRole('link', { name: 'Minha Conta' }).getAttribute('href')).toBe('/painel/perfil')
    expect(screen.queryByRole('link', { name: 'Meu Painel' })).toBeNull()
  })

  it('prestador com cadastro completo acessa o painel e a área do cliente', () => {
    estado.valor = { session: sessao, role: 'prestador', prestadorStatus: 'ativo', loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getAllByRole('link', { name: 'Meu Painel' })[0].getAttribute('href')).toBe('/dashboard')
    expect(screen.getByRole('link', { name: 'Minha Conta' }).getAttribute('href')).toBe('/painel/perfil')
  })

  it('prestador com cadastro pendente vê Concluir Cadastro e a área do cliente', () => {
    estado.valor = { session: sessao, role: 'prestador', prestadorStatus: 'pendente', loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getAllByRole('link', { name: 'Concluir Cadastro' })[0].getAttribute('href')).toBe('/cadastro')
    expect(screen.getByRole('link', { name: 'Minha Conta' }).getAttribute('href')).toBe('/painel/perfil')
  })
})
