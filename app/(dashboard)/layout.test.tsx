import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }))
vi.mock('@/components/Header', () => ({ default: () => <div data-testid="header" /> }))

import DashboardLayout from './layout'

describe('layout do painel do prestador', () => {
  it('reserva o mesmo topo da área do cliente (cabeçalho + respiro), sem título colado', () => {
    const { container } = render(<DashboardLayout><p>conteúdo</p></DashboardLayout>)
    const main = container.querySelector('main')!
    expect(main.className).toContain('pt-24')
    expect(main.className).toContain('md:pt-26')
    expect(main.className).not.toMatch(/(^|\s)pt-16(\s|$)/)
    expect(main.className).not.toContain('sm:pt-28')
  })

  it('nada dentro do painel consegue alargar a página para os lados', () => {
    const { container } = render(<DashboardLayout><p>conteúdo</p></DashboardLayout>)
    expect((container.firstElementChild as HTMLElement).className).toContain('overflow-x-clip')
  })
})
