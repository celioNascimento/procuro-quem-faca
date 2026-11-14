// components/home/HeaderBotoes.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/', useSearchParams: () => new URLSearchParams() }))
vi.mock('@/lib/db/logs', () => ({ insertLog: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: null, role: null, prestadorStatus: null, roleLoading: false, loading: false, erroLogin: false, loginGoogle: vi.fn() }),
}))

import { HeaderBotoes } from '@/components/home/HeaderBotoes'

describe('HeaderBotoes (visitante)', () => {
  it('o botão do cliente tem nome acessível mesmo quando só aparece o ícone', () => {
    render(<HeaderBotoes />)
    expect(screen.getByRole('button', { name: /área do cliente/i })).toBeTruthy()
  })

  it('"Sou Profissional" é um texto só (sem espaço duplo entre as palavras)', () => {
    render(<HeaderBotoes />)
    const link = screen.getByRole('link', { name: /profissional/i })
    expect(link.textContent).toBe('Sou Profissional')
  })
})
