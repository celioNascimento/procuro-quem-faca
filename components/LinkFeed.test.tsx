import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ session: null, role: null, prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }) }))
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }), usePathname: () => '/', useSearchParams: () => new URLSearchParams() }))
vi.mock('@/components/Logo', () => ({ default: () => null }))
vi.mock('@/components/BackButton', () => ({ default: () => null }))

import { LinkFeed } from './LinkFeed'
import Header from './Header'

afterEach(cleanup)

describe('LinkFeed e Header', () => {
  it('o link leva ao feed e tem nome para leitores de tela', () => {
    render(<LinkFeed />)
    expect(screen.getByRole('link', { name: 'Ver o feed de trabalhos' }).getAttribute('href')).toBe('/feed')
  })
  it('o Header das telas internas mostra o link do feed', () => {
    render(<Header href="/" />)
    expect(screen.getByTestId('link-feed-header').getAttribute('href')).toBe('/feed')
  })
  it('na página do feed o atalho continua no lugar, marcado como página atual', () => {
    render(<Header href="/" feedAtivo />)
    expect(screen.getByTestId('link-feed-header').getAttribute('aria-current')).toBe('page')
  })
  it('fora do feed o atalho não é marcado como atual', () => {
    render(<LinkFeed />)
    expect(screen.getByTestId('link-feed-header').getAttribute('aria-current')).toBeNull()
  })
  it('o atalho do cabeçalho só aparece no computador (no celular o feed fica no menu da conta)', () => {
    render(<LinkFeed />)
    const classes = screen.getByTestId('link-feed-header').className.split(' ')
    expect(classes).toContain('hidden')
    expect(classes).toContain('md:flex')
  })
})
