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

  it('cliente vê só a Área do cliente, sem atalho para a área do profissional', () => {
    estado.valor = { session: sessao, role: 'cliente', prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getByRole('link', { name: 'Área do cliente' }).getAttribute('href')).toBe('/painel/perfil')
    expect(screen.queryByRole('link', { name: 'Área do profissional' })).toBeNull()
  })

  it('profissional com cadastro completo acessa a área do profissional e a área do cliente', () => {
    estado.valor = { session: sessao, role: 'prestador', prestadorStatus: 'ativo', loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getAllByRole('link', { name: 'Área do profissional' })[0].getAttribute('href')).toBe('/dashboard')
    expect(screen.getByRole('link', { name: 'Área do cliente' }).getAttribute('href')).toBe('/painel/perfil')
  })

  it('profissional com cadastro pendente vê Concluir cadastro e a área do cliente', () => {
    estado.valor = { session: sessao, role: 'prestador', prestadorStatus: 'pendente', loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getAllByRole('link', { name: 'Concluir cadastro' })[0].getAttribute('href')).toBe('/cadastro')
    expect(screen.getByRole('link', { name: 'Área do cliente' }).getAttribute('href')).toBe('/painel/perfil')
  })
})
