import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const estado = vi.hoisted(() => ({
  valor: { session: { user: { id: 'u1' } }, role: 'cliente', prestadorStatus: null, roleLoading: false } as Record<string, unknown>,
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => estado.valor }))

import { ConvitePrestador } from '@/components/painel/ConvitePrestador'

describe('ConvitePrestador', () => {
  afterEach(() => cleanup())

  it('convida a conta sem cadastro profissional a se cadastrar', () => {
    estado.valor = { session: { user: { id: 'u1' } }, role: 'cliente', prestadorStatus: null, roleLoading: false }
    render(<ConvitePrestador />)
    expect(screen.getByRole('link', { name: /cadastre-se como prestador/i }).getAttribute('href')).toBe('/cadastro')
  })

  it('não aparece para quem já tem perfil profissional, completo ou pendente', () => {
    estado.valor = { session: { user: { id: 'u1' } }, role: 'prestador', prestadorStatus: 'ativo', roleLoading: false }
    const { container, unmount } = render(<ConvitePrestador />)
    expect(container.innerHTML).toBe('')
    unmount()

    estado.valor = { session: { user: { id: 'u1' } }, role: 'prestador', prestadorStatus: 'pendente', roleLoading: false }
    const outro = render(<ConvitePrestador />)
    expect(outro.container.innerHTML).toBe('')
  })

  it('não mostra nada enquanto a conta ainda carrega', () => {
    estado.valor = { session: { user: { id: 'u1' } }, role: null, prestadorStatus: null, roleLoading: true }
    const { container } = render(<ConvitePrestador />)
    expect(container.innerHTML).toBe('')
  })

  it('não mostra nada sem sessão', () => {
    estado.valor = { session: null, role: null, prestadorStatus: null, roleLoading: false }
    const { container } = render(<ConvitePrestador />)
    expect(container.innerHTML).toBe('')
  })
})
