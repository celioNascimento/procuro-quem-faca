import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MenuDoCard } from './MenuDoCard'

afterEach(cleanup)

describe('MenuDoCard', () => {
  it('começa fechado e abre com Copiar link e Denunciar', () => {
    render(<MenuDoCard hrefDenuncia="/denunciar/2" onCopiarLink={vi.fn()} />)
    expect(screen.queryByTestId('feed-menu-itens')).toBeNull()
    const botao = screen.getByRole('button', { name: 'Mais opções' })
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('feed-menu-denunciar').getAttribute('href')).toBe('/denunciar/2')
  })
  it('copiar link chama a ação e fecha o menu', () => {
    const onCopiarLink = vi.fn()
    render(<MenuDoCard hrefDenuncia="/denunciar/2" onCopiarLink={onCopiarLink} />)
    fireEvent.click(screen.getByTestId('feed-menu'))
    fireEvent.click(screen.getByTestId('feed-menu-copiar'))
    expect(onCopiarLink).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('feed-menu-itens')).toBeNull()
  })
  it('fecha com Escape e ao tocar fora', () => {
    render(<div><span data-testid="fora">fora</span><MenuDoCard hrefDenuncia="/denunciar/2" onCopiarLink={vi.fn()} /></div>)
    fireEvent.click(screen.getByTestId('feed-menu'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('feed-menu-itens')).toBeNull()
    fireEvent.click(screen.getByTestId('feed-menu'))
    fireEvent.mouseDown(screen.getByTestId('fora'))
    expect(screen.queryByTestId('feed-menu-itens')).toBeNull()
  })
})
