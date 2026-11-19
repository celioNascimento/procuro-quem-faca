import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FeedCard } from './FeedCard'
import type { FeedItem } from '@/lib/feed/feed'

afterEach(cleanup)

const item: FeedItem = {
  projetoId: 'a', titulo: 'Reforma de varanda', descricao: 'Piso novo e pintura.', concluidoEm: null,
  prestador: { id: 2, nome: 'Pedro Pedreiro', slug: 'pedro', categoria: 'Pedreiro', cidade: 'Londrina' },
  fotos: ['https://x/1.jpg'], totalCurtidas: 2, curtidoPorMim: false, seguindo: false, meu: false,
}

describe('FeedCard', () => {
  it('mostra prestador, trabalho e curtidas, com links para o perfil', () => {
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} />)
    expect(screen.getByText('Pedro Pedreiro')).toBeTruthy()
    expect(screen.getByText('Pedreiro · Londrina')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Reforma de varanda' })).toBeTruthy()
    expect(screen.getByTestId('feed-curtidas').textContent).toBe('2 curtidas')
    expect(screen.getByTestId('feed-prestador').getAttribute('href')).toBe('/pedro')
  })
  it('não exibe dados pessoais (cliente, telefone, endereço)', () => {
    const { container } = render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} />)
    expect(container.textContent).not.toMatch(/whatsapp|telefone|endereço|cliente:/i)
  })
  it('curtir e seguir chamam as ações certas e refletem o estado', () => {
    const onCurtir = vi.fn(); const onSeguir = vi.fn()
    const { rerender } = render(<FeedCard item={item} onCurtir={onCurtir} onSeguir={onSeguir} onCompartilhar={vi.fn()} />)
    fireEvent.click(screen.getByTestId('feed-curtir'))
    fireEvent.click(screen.getByTestId('feed-seguir'))
    expect(onCurtir).toHaveBeenCalledWith('a')
    expect(onSeguir).toHaveBeenCalledWith(2)
    expect(screen.getByTestId('feed-seguir').getAttribute('aria-pressed')).toBe('false')
    rerender(<FeedCard item={{ ...item, seguindo: true, curtidoPorMim: true }} onCurtir={onCurtir} onSeguir={onSeguir} onCompartilhar={vi.fn()} />)
    expect(screen.getByTestId('feed-seguir').textContent).toContain('Seguindo')
    expect(screen.getByTestId('feed-curtir').getAttribute('aria-pressed')).toBe('true')
  })
  it('trabalho meu: sem Seguir e sem Curtir, com etiqueta e total só para leitura', () => {
    const onCurtir = vi.fn(); const onSeguir = vi.fn()
    render(<FeedCard item={{ ...item, meu: true }} onCurtir={onCurtir} onSeguir={onSeguir} onCompartilhar={vi.fn()} />)
    expect(screen.queryByTestId('feed-seguir')).toBeNull()
    expect(screen.queryByTestId('feed-curtir')).toBeNull()
    // O único botão que sobra no trabalho meu é o de compartilhar.
    expect(screen.getAllByRole('button').map(b => b.getAttribute('data-testid'))).toEqual(['feed-compartilhar'])
    expect(screen.getByTestId('feed-meu').textContent).toBe('Seu trabalho')
    expect(screen.getByTestId('feed-curtidas').textContent).toBe('2 curtidas')
    expect(screen.getByTestId('feed-prestador').getAttribute('href')).toBe('/pedro')
  })
  it('trabalho meu sem curtidas: texto próprio, sem "seja o primeiro a curtir"', () => {
    render(<FeedCard item={{ ...item, meu: true, totalCurtidas: 0 }} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} />)
    expect(screen.getByTestId('feed-curtidas').textContent).toBe('Nenhuma curtida ainda')
  })
  it('trabalho de outro: não mostra a etiqueta "Seu trabalho"', () => {
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} />)
    expect(screen.queryByTestId('feed-meu')).toBeNull()
  })
  it('compartilhar chama a ação com o trabalho, também no trabalho meu', () => {
    const onCompartilhar = vi.fn()
    const { rerender } = render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={onCompartilhar} />)
    fireEvent.click(screen.getByTestId('feed-compartilhar'))
    expect(onCompartilhar).toHaveBeenCalledWith(item)
    rerender(<FeedCard item={{ ...item, meu: true }} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={onCompartilhar} />)
    fireEvent.click(screen.getByTestId('feed-compartilhar'))
    expect(onCompartilhar).toHaveBeenCalledTimes(2)
  })
  it('o botão de compartilhar tem nome acessível com o título do trabalho', () => {
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Compartilhar o trabalho Reforma de varanda' })).toBeTruthy()
  })
})
