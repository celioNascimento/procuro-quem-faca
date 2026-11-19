import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const hook = vi.fn()
vi.mock('@/hooks/usePortfolioDashboard', () => ({ usePortfolioDashboard: () => hook() }))
import { FeedDeTrabalhosPanel } from './FeedDeTrabalhosPanel'

const base = { loading: false, erro: false, erroFeed: null, alternarFeed: vi.fn() }
const t = (id: string, extra = {}) => ({ id, titulo: `Trabalho ${id}`, status: 'finalizado', feed_aceito_em: '2026-11-19T10:00:00Z', feed_oculto: false, feed_revogado_em: null, ...extra })

beforeEach(() => { base.alternarFeed = vi.fn() })
afterEach(cleanup)

describe('FeedDeTrabalhosPanel', () => {
  it('lista só os trabalhos elegíveis, cada um com seu interruptor', () => {
    hook.mockReturnValue({ ...base, projetos: [t('a'), t('b', { feed_oculto: true }), t('c', { status: 'em_execucao' }), t('d', { feed_aceito_em: null }), t('e', { feed_revogado_em: '2026-11-20T00:00:00Z' })] })
    render(<FeedDeTrabalhosPanel />)
    expect(screen.getAllByRole('switch')).toHaveLength(2)
    expect(screen.getByTestId('feed-switch-a').getAttribute('aria-checked')).toBe('true')
    expect(screen.getByTestId('feed-switch-b').getAttribute('aria-checked')).toBe('false')
  })
  it('clicar alterna o trabalho certo', () => {
    hook.mockReturnValue({ ...base, projetos: [t('a')] })
    render(<FeedDeTrabalhosPanel />)
    fireEvent.click(screen.getByTestId('feed-switch-a'))
    expect(base.alternarFeed).toHaveBeenCalledWith('a')
  })
  it('sem trabalhos elegíveis explica quando aparecem', () => {
    hook.mockReturnValue({ ...base, projetos: [t('c', { status: 'em_execucao' })] })
    render(<FeedDeTrabalhosPanel />)
    expect(screen.getByTestId('divulgacao-feed-vazio').textContent).toMatch(/aceitar que ele seja divulgado/)
  })
  it('mostra o erro de alternar e o erro de carregar', () => {
    hook.mockReturnValue({ ...base, projetos: [t('a')], erroFeed: 'Não conseguimos alterar agora.' })
    const { unmount } = render(<FeedDeTrabalhosPanel />)
    expect(screen.getByTestId('feed-erro').textContent).toMatch(/Não conseguimos alterar/)
    unmount()
    hook.mockReturnValue({ ...base, projetos: [], erro: true })
    render(<FeedDeTrabalhosPanel />)
    expect(screen.getByRole('alert').textContent).toMatch(/continuam salvos/)
  })
})
