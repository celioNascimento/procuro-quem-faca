import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const setFiltro = vi.fn()
const estado = vi.hoisted(() => ({ lista: [] as unknown[], filtro: 'abertas' }))

vi.mock('@/hooks/admin/useAdminTitular', () => ({
  useAdminTitular: () => ({
    lista: estado.lista, total: 3, carregando: false, filtro: estado.filtro, setFiltro, processandoId: null, erro: null,
    marcarEmAnalise: vi.fn(), concluir: vi.fn(), enviarLinkAoWhatsappDoPerfil: vi.fn(),
  }),
}))

import { TitularCentral } from './TitularCentral'

describe('Pedidos do titular', () => {
  afterEach(() => { cleanup(); setFiltro.mockClear(); estado.lista = []; estado.filtro = 'abertas' })

  it('mostra o título e o prazo de 15 dias', () => {
    render(<TitularCentral />)
    expect(screen.getByRole('heading', { name: 'Pedidos do titular' })).toBeTruthy()
    expect(screen.getByText(/em até 15 dias/)).toBeTruthy()
  })

  it('lista vazia mostra mensagem de fila limpa', () => {
    render(<TitularCentral />)
    expect(screen.getByText('Nenhum pedido em aberto')).toBeTruthy()
  })

  it('o filtro "Todas" mostra a contagem e muda a lista', () => {
    render(<TitularCentral />)
    fireEvent.click(screen.getByRole('button', { name: /Todas \(3\)/ }))
    expect(setFiltro).toHaveBeenCalledWith('todas')
  })
})
