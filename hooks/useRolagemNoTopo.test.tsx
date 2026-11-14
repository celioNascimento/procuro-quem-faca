import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useRolagemNoTopo } from '@/hooks/useRolagemNoTopo'

function Tela() { useRolagemNoTopo(); return null }

describe('useRolagemNoTopo', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
    window.history.scrollRestoration = 'auto'
  })

  it('trava a restauração automática enquanto a tela está aberta e vai ao topo', () => {
    render(<Tela />)
    expect(window.history.scrollRestoration).toBe('manual')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })

  it('devolve o valor anterior ao sair da tela', () => {
    const { unmount } = render(<Tela />)
    unmount()
    expect(window.history.scrollRestoration).toBe('auto')
  })
})
