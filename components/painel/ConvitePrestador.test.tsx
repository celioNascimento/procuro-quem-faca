import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const estado = vi.hoisted(() => ({
  valor: { session: { user: { id: 'u1' } }, role: 'cliente', prestadorStatus: null, roleLoading: false } as Record<string, unknown>,
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => estado.valor }))

import { ConvitePrestador } from '@/components/painel/ConvitePrestador'

describe('ConvitePrestador', () => {
  afterEach(() => cleanup())

  it('convida a conta de cliente a se tornar prestador', () => {
    estado.valor = { session: { user: { id: 'u1' } }, role: 'cliente', prestadorStatus: null, roleLoading: false }
    render(<ConvitePrestador />)
    expect(screen.getByRole('link', { name: /quero ser prestador/i }).getAttribute('href')).toBe('/cadastro')
  })

  it('mostra como concluir o cadastro quando está pendente', () => {
    estado.valor = { session: { user: { id: 'u1' } }, role: 'prestador', prestadorStatus: 'pendente', roleLoading: false }
    render(<ConvitePrestador />)
    expect(screen.getByRole('link', { name: /concluir cadastro/i }).getAttribute('href')).toBe('/cadastro')
  })

  it('leva ao painel profissional quando o cadastro está completo', () => {
    estado.valor = { session: { user: { id: 'u1' } }, role: 'prestador', prestadorStatus: 'ativo', roleLoading: false }
    render(<ConvitePrestador />)
    expect(screen.getByRole('link', { name: /acessar painel profissional/i }).getAttribute('href')).toBe('/dashboard')
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
