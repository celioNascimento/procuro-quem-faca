// components/home/HeaderBotoesLogado.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const auth = vi.hoisted(() => ({ role: 'cliente' as 'cliente' | 'prestador' }))

vi.mock('next/navigation', () => ({ usePathname: () => '/', useSearchParams: () => new URLSearchParams() }))
vi.mock('@/lib/db/logs', () => ({ insertLog: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: {} }, role: auth.role, prestadorStatus: 'aprovado', roleLoading: false, loading: false, erroLogin: false, loginGoogle: vi.fn() }),
}))

import { HeaderBotoes } from '@/components/home/HeaderBotoes'

describe('HeaderBotoes (logado)', () => {
  it('quem só é cliente vê um único botão "Área do cliente"', () => {
    auth.role = 'cliente'
    render(<HeaderBotoes />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].textContent).toBe('Área do cliente')
    expect(links[0].getAttribute('href')).toBe('/painel/perfil')
  })

  it('prestador continua vendo Cliente e Meu Painel', () => {
    auth.role = 'prestador'
    render(<HeaderBotoes />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })
})
