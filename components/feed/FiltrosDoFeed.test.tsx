import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FiltrosDoFeed } from './FiltrosDoFeed'
import type { FiltrosFeed } from '@/lib/feed/filtros'

afterEach(cleanup)

const SEM: FiltrosFeed = { categoriaId: null, cidadeId: null, estado: null }
const CIDADE = { id: '15123e3f-9f76-4d66-b2ee-f03c45de38fa', nome: 'Londrina', estadoSigla: 'PR' }

function montar(filtros: FiltrosFeed = SEM) {
  const fns = { onMudar: vi.fn(), onMudarEstado: vi.fn(), onLimpar: vi.fn() }
  render(<FiltrosDoFeed filtros={filtros} categorias={[{ id: 'c1', nome: 'Elétrica' }]} estados={['PR']} cidades={[CIDADE]} {...fns} />)
  return fns
}

describe('FiltrosDoFeed', () => {
  it('começa fechado: só o botão Filtrar, sem campos', () => {
    montar()
    expect(screen.getByTestId('feed-filtrar').getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByTestId('feed-filtros-painel')).toBeNull()
    expect(screen.queryByTestId('feed-filtros-contador')).toBeNull()
  })
  it('mostra o número de filtros ligados no botão', () => {
    montar({ categoriaId: 'c1', cidadeId: CIDADE.id, estado: null })
    expect(screen.getByTestId('feed-filtros-contador').textContent).toBe('2')
  })
  it('abre o painel com os três campos e fecha em "Pronto"', () => {
    montar()
    fireEvent.click(screen.getByTestId('feed-filtrar'))
    expect(screen.getByTestId('feed-categoria')).toBeTruthy()
    expect(screen.getByTestId('feed-estado')).toBeTruthy()
    expect(screen.getByTestId('feed-cidade')).toBeTruthy()
    fireEvent.click(screen.getByTestId('feed-filtros-fechar'))
    expect(screen.queryByTestId('feed-filtros-painel')).toBeNull()
  })
  it('escolher uma opção avisa na hora; estado usa o tratamento próprio', () => {
    const f = montar()
    fireEvent.click(screen.getByTestId('feed-filtrar'))
    fireEvent.change(screen.getByTestId('feed-categoria'), { target: { value: 'c1' } })
    expect(f.onMudar).toHaveBeenCalledWith({ categoriaId: 'c1' })
    fireEvent.change(screen.getByTestId('feed-cidade'), { target: { value: CIDADE.id } })
    expect(f.onMudar).toHaveBeenCalledWith({ cidadeId: CIDADE.id })
    fireEvent.change(screen.getByTestId('feed-estado'), { target: { value: 'PR' } })
    expect(f.onMudarEstado).toHaveBeenCalledWith('PR')
  })
  it('"Limpar filtros" fica desligado sem filtro e funciona com filtro', () => {
    const f = montar({ ...SEM, estado: 'PR' })
    fireEvent.click(screen.getByTestId('feed-filtrar'))
    fireEvent.click(screen.getByTestId('feed-filtros-limpar'))
    expect(f.onLimpar).toHaveBeenCalled()
    cleanup()
    montar()
    fireEvent.click(screen.getByTestId('feed-filtrar'))
    expect((screen.getByTestId('feed-filtros-limpar') as HTMLButtonElement).disabled).toBe(true)
  })
})
