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
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(screen.getByText('Pedro Pedreiro')).toBeTruthy()
    expect(screen.getByText('Pedreiro · Londrina')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Reforma de varanda' })).toBeTruthy()
    expect(screen.getByTestId('feed-curtidas').textContent).toBe('2 curtidas')
    expect(screen.getByTestId('feed-prestador').getAttribute('href')).toBe('/pedro')
  })
  it('não exibe dados pessoais (cliente, telefone, endereço)', () => {
    const { container } = render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(container.textContent).not.toMatch(/whatsapp|telefone|endereço|cliente:/i)
  })
  it('curtir e seguir chamam as ações certas e refletem o estado', () => {
    const onCurtir = vi.fn(); const onSeguir = vi.fn()
    const { rerender } = render(<FeedCard item={item} onCurtir={onCurtir} onSeguir={onSeguir} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    fireEvent.click(screen.getByTestId('feed-curtir'))
    fireEvent.click(screen.getByTestId('feed-seguir'))
    expect(onCurtir).toHaveBeenCalledWith('a')
    expect(onSeguir).toHaveBeenCalledWith(2)
    expect(screen.getByTestId('feed-seguir').getAttribute('aria-pressed')).toBe('false')
    rerender(<FeedCard item={{ ...item, seguindo: true, curtidoPorMim: true }} onCurtir={onCurtir} onSeguir={onSeguir} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(screen.getByTestId('feed-seguir').textContent).toContain('Seguindo')
    expect(screen.getByTestId('feed-curtir').getAttribute('aria-pressed')).toBe('true')
  })
  it('trabalho meu: sem Seguir e sem Curtir, com etiqueta e total só para leitura', () => {
    const onCurtir = vi.fn(); const onSeguir = vi.fn()
    render(<FeedCard item={{ ...item, meu: true }} onCurtir={onCurtir} onSeguir={onSeguir} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(screen.queryByTestId('feed-seguir')).toBeNull()
    expect(screen.queryByTestId('feed-curtir')).toBeNull()
    // O único botão que sobra no trabalho meu é o de compartilhar.
    expect(screen.getAllByRole('button').map(b => b.getAttribute('data-testid'))).toEqual(['feed-compartilhar'])
    expect(screen.queryByTestId('feed-falar')).toBeNull()
    expect(screen.queryByTestId('feed-menu')).toBeNull()
    expect(screen.getByTestId('feed-meu').textContent).toBe('Seu trabalho')
    expect(screen.getByTestId('feed-curtidas').textContent).toBe('2 curtidas')
    expect(screen.getByTestId('feed-prestador').getAttribute('href')).toBe('/pedro')
  })
  it('trabalho meu sem curtidas: texto próprio, sem "seja o primeiro a curtir"', () => {
    render(<FeedCard item={{ ...item, meu: true, totalCurtidas: 0 }} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(screen.getByTestId('feed-curtidas').textContent).toBe('Nenhuma curtida ainda')
  })
  it('trabalho de outro: não mostra a etiqueta "Seu trabalho"', () => {
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(screen.queryByTestId('feed-meu')).toBeNull()
  })
  it('compartilhar chama a ação com o trabalho, também no trabalho meu', () => {
    const onCompartilhar = vi.fn()
    const { rerender } = render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={onCompartilhar} onCopiarLink={vi.fn()} />)
    fireEvent.click(screen.getByTestId('feed-compartilhar'))
    expect(onCompartilhar).toHaveBeenCalledWith(item)
    rerender(<FeedCard item={{ ...item, meu: true }} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={onCompartilhar} onCopiarLink={vi.fn()} />)
    fireEvent.click(screen.getByTestId('feed-compartilhar'))
    expect(onCompartilhar).toHaveBeenCalledTimes(2)
  })
  it('o botão de compartilhar tem nome acessível com o título do trabalho', () => {
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Compartilhar o trabalho Reforma de varanda' })).toBeTruthy()
  })
  it('"Falar com o profissional" abre o perfil já com o trabalho aberto', () => {
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    expect(screen.getByTestId('feed-falar').getAttribute('href')).toBe('/pedro?projeto=a')
    expect(screen.getByTestId('feed-ver-perfil').getAttribute('href')).toBe('/pedro')
  })
  it('toque duplo na foto curte; se já curtiu, não descurte', () => {
    const onCurtir = vi.fn()
    const { rerender } = render(<FeedCard item={item} onCurtir={onCurtir} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    fireEvent.click(screen.getByTestId('feed-fotos')); fireEvent.click(screen.getByTestId('feed-fotos'))
    expect(onCurtir).toHaveBeenCalledWith('a')
    onCurtir.mockClear()
    rerender(<FeedCard item={{ ...item, curtidoPorMim: true }} onCurtir={onCurtir} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    fireEvent.click(screen.getByTestId('feed-fotos')); fireEvent.click(screen.getByTestId('feed-fotos'))
    expect(onCurtir).not.toHaveBeenCalled()
  })
  it('trabalho meu: toque duplo não curte', () => {
    const onCurtir = vi.fn()
    render(<FeedCard item={{ ...item, meu: true }} onCurtir={onCurtir} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={vi.fn()} />)
    fireEvent.click(screen.getByTestId('feed-fotos')); fireEvent.click(screen.getByTestId('feed-fotos'))
    expect(onCurtir).not.toHaveBeenCalled()
  })
  it('menu ⋯: copiar link chama a ação e denunciar leva à denúncia do trabalho', () => {
    const onCopiarLink = vi.fn()
    render(<FeedCard item={item} onCurtir={vi.fn()} onSeguir={vi.fn()} onCompartilhar={vi.fn()} onCopiarLink={onCopiarLink} />)
    fireEvent.click(screen.getByTestId('feed-menu'))
    expect(screen.getByTestId('feed-menu-denunciar').getAttribute('href')).toBe('/denunciar/2?trabalho=a&titulo=Reforma%20de%20varanda')
    fireEvent.click(screen.getByTestId('feed-menu-copiar'))
    expect(onCopiarLink).toHaveBeenCalledWith(item)
  })
})
