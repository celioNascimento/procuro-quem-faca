import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { FiltroSidebar } from './FiltroSidebar'

afterEach(cleanup)

const base = {
  filtroEstado: '', filtroRegiao: '', filtroCidade: '', filtroGrupo: '', filtroCategoria: '', totalAtivos: 0,
  estadosDisponiveis: [{ sigla: 'PR', count: 55 }, { sigla: 'RS', count: 17 }],
  regioesDisponiveis: [{ id: 'r1', nome: 'Região Metropolitana', count: 17 }],
  cidadesDisponiveis: [{ id: 'c1', nome: 'Porto Alegre', count: 17 }],
  gruposDisponiveis: [{ id: 'g1', nome: 'Construção e Reformas', count: 17 }],
  categoriasDisponiveis: [{ id: 'k1', nome: 'Pedreiro', count: 10 }, { id: 'k2', nome: 'Pintor', count: 7 }],
  onAplicar: vi.fn(), onLimpar: vi.fn(),
}

describe('FiltroSidebar', () => {
  it('esconde o filtro que só tem uma opção e não está marcado', () => {
    render(<FiltroSidebar {...base} />)
    expect(screen.getByText('Estado')).toBeTruthy()
    expect(screen.queryByText('Região')).toBeNull()
    expect(screen.queryByText('Cidade')).toBeNull()
    expect(screen.queryByText('Área')).toBeNull()
  })

  it('mantém visível o filtro de opção única quando ela está marcada (para poder desmarcar)', () => {
    render(<FiltroSidebar {...base} filtroRegiao="r1" totalAtivos={1} />)
    expect(screen.getByText('Região')).toBeTruthy()
  })

  it('com uma só Área, a Categoria já fica liberada (não manda escolher uma área escondida)', () => {
    render(<FiltroSidebar {...base} />)
    expect(screen.queryByText(/escolha uma área primeiro/i)).toBeNull()
    expect((screen.getByRole('button', { name: /categoria/i }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('com várias Áreas e nenhuma marcada, a Categoria espera a Área', () => {
    render(<FiltroSidebar {...base} gruposDisponiveis={[{ id: 'g1', nome: 'Construção', count: 10 }, { id: 'g2', nome: 'Beleza', count: 7 }]} />)
    expect(screen.getByText(/escolha uma área primeiro/i)).toBeTruthy()
  })
})
