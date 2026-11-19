import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FeedCard } from './FeedCard'
import type { FeedItem } from '@/lib/feed/feed'

afterEach(cleanup)

const item: FeedItem = {
  projetoId: 'a', titulo: 'Reforma de varanda', descricao: 'Piso novo e pintura.', concluidoEm: null,
  prestador: { id: 2, nome: 'Pedro Pedreiro', slug: 'pedro', categoria: 'Pedreiro', cidade: 'Londrina' },
  fotos: ['https://x/1.jpg'], totalCurtidas: 2, curtidoPorMim: false, seguindo: false,
}

describe('FeedCard', () => {
  it('mostra prestador, trabalho e curtidas, com links para o perfil', () => {
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} />)
    expect(screen.getByText('Pedro Pedreiro')).toBeTruthy()
    expect(screen.getByText('Pedreiro · Londrina')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Reforma de varanda' })).toBeTruthy()
    expect(screen.getByTestId('feed-curtidas').textContent).toBe('2 curtidas')
    expect(screen.getByTestId('feed-prestador').getAttribute('href')).toBe('/pedro')
  })
  it('não exibe dados pessoais (cliente, telefone, endereço)', () => {
    const { container } = render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} />)
    expect(container.textContent).not.toMatch(/whatsapp|telefone|endereço|cliente:/i)
  })
  it('curtir e seguir chamam as ações certas e refletem o estado', () => {
    const onCurtir = vi.fn(); const onSeguir = vi.fn()
    const { rerender } = render(<FeedCard item={item} onCurtir={onCurtir} onSeguir={onSeguir} />)
    fireEvent.click(screen.getByTestId('feed-curtir'))
    fireEvent.click(screen.getByTestId('feed-seguir'))
    expect(onCurtir).toHaveBeenCalledWith('a')
    expect(onSeguir).toHaveBeenCalledWith(2)
    expect(screen.getByTestId('feed-seguir').getAttribute('aria-pressed')).toBe('false')
    rerender(<FeedCard item={{ ...item, seguindo: true, curtidoPorMim: true }} onCurtir={onCurtir} onSeguir={onSeguir} />)
    expect(screen.getByTestId('feed-seguir').textContent).toContain('Seguindo')
    expect(screen.getByTestId('feed-curtir').getAttribute('aria-pressed')).toBe('true')
  })
})
