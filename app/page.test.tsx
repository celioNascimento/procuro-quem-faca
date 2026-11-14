import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/dynamic', () => ({ default: () => () => null }))
vi.mock('@/hooks/useSugestoes', () => ({ useSugestoes: () => ({ sugestoes: [], carregado: true }) }))
let auth: { session: unknown; role: string | null; prestadorStatus?: string | null; roleLoading: boolean } = { session: null, role: null, roleLoading: false }
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }))
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
  auth = { session: null, role: null, roleLoading: false }
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

describe('home — conteúdo e estrutura', () => {
  it('tem um único h1 que diz o que é o site', () => {
    render(<Home />)
    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0].textContent).toMatch(/profissionais perto de você/i)
  })

  it('a logo não é um link para a própria home', () => {
    render(<Home />)
    expect(screen.queryByRole('link', { name: /procuro quem faça/i })).toBeNull()
  })

  it('o convite de localização na home é a versão curta', () => {
    render(<Home />)
    expect(screen.queryByText(/o resultado fica mais certo/i)).toBeNull()
    expect(screen.getByText(/não guardamos a sua posição\./i)).toBeTruthy()
  })
})

describe('home — cartão de profissional', () => {
  it('visitante vê o convite para se cadastrar', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /é prestador de serviços/i }).getAttribute('href')).toBe('/login')
  })

  it('cliente logado vê "Quer oferecer serviços?"', () => {
    auth = { session: {}, role: 'cliente', roleLoading: false }
    render(<Home />)
    expect(screen.getByRole('link', { name: /quer oferecer serviços/i }).getAttribute('href')).toBe('/cadastro')
  })

  it('prestador ativo vê "Área do Profissional" e vai ao painel', () => {
    auth = { session: {}, role: 'prestador', prestadorStatus: 'ativo', roleLoading: false }
    render(<Home />)
    expect(screen.getByRole('link', { name: /área do profissional/i }).getAttribute('href')).toBe('/dashboard')
  })

  it('prestador com cadastro pendente vê "Cadastro em andamento" e volta ao cadastro', () => {
    auth = { session: {}, role: 'prestador', prestadorStatus: 'pendente', roleLoading: false }
    render(<Home />)
    expect(screen.getByRole('link', { name: /cadastro em andamento/i }).getAttribute('href')).toBe('/cadastro')
  })
})
