import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('@/hooks/useSugestoes', () => ({ useSugestoes: () => ({ sugestoes: [], carregado: true }) }))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: null, role: null, prestadorStatus: null, roleLoading: false }),
}))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/lib/db/logs', () => ({ insertLog: vi.fn() }))
vi.mock('@/components/Logo', () => ({ default: () => null }))
vi.mock('@/components/home/SearchForm', () => ({ default: () => <form aria-label="busca" /> }))

let cidadeSalva: { id: string; nome: string } | null = null
vi.mock('@/lib/contexts/LocationContext', () => ({
  useLocation: () => ({ cidadeAtual: cidadeSalva, estadoLocalizacao: 'parado', solicitarLocalizacao: vi.fn() }),
}))

import Home from './page'

beforeEach(() => {
  cidadeSalva = null
  localStorage.clear()
})

describe('home — convite de localização', () => {
  it('aparece quando não sabemos a cidade da pessoa', () => {
    render(<Home />)
    expect(screen.getByRole('button', { name: /usar minha localização/i })).toBeTruthy()
  })

  it('não aparece quando já há cidade salva', () => {
    cidadeSalva = { id: 'c1', nome: 'Londrina' }
    render(<Home />)
    expect(screen.queryByRole('button', { name: /usar minha localização/i })).toBeNull()
  })

  it('não aparece de novo depois de "Agora não" (30 dias)', () => {
    localStorage.setItem('pqf:convite-localizacao', String(Date.now()))
    render(<Home />)
    expect(screen.queryByRole('button', { name: /usar minha localização/i })).toBeNull()
  })
})
