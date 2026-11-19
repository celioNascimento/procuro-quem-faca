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
    expect(screen.getByRole('link', { name: 'Ver trabalhos concluídos' }).getAttribute('href')).toBe('/feed')
  })
  it('o Header das telas internas mostra o link do feed', () => {
    render(<Header href="/" />)
    expect(screen.getByTestId('link-feed-header').getAttribute('href')).toBe('/feed')
  })
  it('na página do feed (semLinkFeed) o link não aparece', () => {
    render(<Header href="/" semLinkFeed />)
    expect(screen.queryByTestId('link-feed-header')).toBeNull()
  })
})
