import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FotosDoTrabalho } from './FotosDoTrabalho'

afterEach(cleanup)
const fotos = ['https://x/1.jpg', 'https://x/2.jpg', 'https://x/3.jpg']

describe('FotosDoTrabalho', () => {
  it('uma foto só: sem pontinhos nem contador', () => {
    render(<FotosDoTrabalho fotos={[fotos[0]]} titulo="Varanda" onDuploToque={vi.fn()} />)
    expect(screen.getAllByTestId('feed-foto')).toHaveLength(1)
    expect(screen.getByAltText('Varanda')).toBeTruthy()
    expect(screen.queryByTestId('feed-foto-contador')).toBeNull()
    expect(screen.queryAllByTestId('feed-foto-ponto')).toHaveLength(0)
  })
  it('várias fotos: todas no carrossel, contador 1/3 e um ponto por foto com nome acessível', () => {
    render(<FotosDoTrabalho fotos={fotos} titulo="Varanda" onDuploToque={vi.fn()} />)
    expect(screen.getAllByTestId('feed-foto')).toHaveLength(3)
    expect(screen.getByAltText('Varanda (foto 2 de 3)')).toBeTruthy()
    expect(screen.getByTestId('feed-foto-contador').textContent).toBe('1/3')
    expect(screen.getByRole('button', { name: 'Ver foto 3 de 3' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Fotos do trabalho Varanda' })).toBeTruthy()
  })
  it('tocar em um ponto vai para a foto e atualiza o contador', () => {
    render(<FotosDoTrabalho fotos={fotos} titulo="Varanda" onDuploToque={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver foto 3 de 3' }))
    expect(screen.getByTestId('feed-foto-contador').textContent).toBe('3/3')
    expect(screen.getAllByTestId('feed-foto-ponto')[2].getAttribute('aria-current')).toBe('true')
  })
  it('um toque só não curte; dois toques seguidos curtem uma vez e mostram o coração', () => {
    const onDuploToque = vi.fn()
    render(<FotosDoTrabalho fotos={fotos} titulo="Varanda" onDuploToque={onDuploToque} />)
    const faixa = screen.getByTestId('feed-fotos')
    fireEvent.click(faixa)
    expect(onDuploToque).not.toHaveBeenCalled()
    fireEvent.click(faixa)
    expect(onDuploToque).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('feed-foto-coracao')).toBeTruthy()
    fireEvent.click(faixa)
    expect(onDuploToque).toHaveBeenCalledTimes(1)
  })
  it('dois toques separados por mais de 300 ms não contam como duplo', () => {
    vi.useFakeTimers()
    const onDuploToque = vi.fn()
    render(<FotosDoTrabalho fotos={fotos} titulo="Varanda" onDuploToque={onDuploToque} />)
    const faixa = screen.getByTestId('feed-fotos')
    vi.setSystemTime(new Date('2026-11-19T12:00:00Z')); fireEvent.click(faixa)
    vi.setSystemTime(new Date('2026-11-19T12:00:00.500Z')); fireEvent.click(faixa)
    expect(onDuploToque).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
  it('sem onDuploToque (trabalho meu) o toque duplo não faz nada', () => {
    render(<FotosDoTrabalho fotos={fotos} titulo="Varanda" onDuploToque={null} />)
    const faixa = screen.getByTestId('feed-fotos')
    fireEvent.click(faixa); fireEvent.click(faixa)
    expect(screen.queryByTestId('feed-foto-coracao')).toBeNull()
  })
})
