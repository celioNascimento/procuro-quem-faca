import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const hookMock = vi.fn()
vi.mock('@/hooks/useHabilidades', () => ({ useHabilidades: () => hookMock() }))

import GestaoHabilidades from '@/app/(admin)/admin/habilidades/page'

const grupos = [{ id: 'g1', nome: 'Eventos e Festas', slug: 'eventos-e-festas', icone: null, ordem: 1 }]
const categorias = [
  { id: 'c1', nome: 'Doces e Confeitaria', slug: 'doces-e-confeitaria', grupo_id: 'g1', exemplo_descricao: 'Bolo de dois andares com recheio de brigadeiro para 40 pessoas.' },
  { id: 'c2', nome: 'Categoria nova', slug: 'categoria-nova', grupo_id: 'g1', exemplo_descricao: null },
]

function montar() {
  const acoes = {
    adicionarGrupo: vi.fn().mockResolvedValue({ ok: true, error: null }),
    adicionarCategoria: vi.fn().mockResolvedValue({ ok: true, error: null }),
    salvarExemplo: vi.fn().mockResolvedValue({ ok: true, error: null }),
    recarregar: vi.fn(),
  }
  hookMock.mockReturnValue({ grupos, categorias, loading: false, saving: false, error: null, ...acoes })
  return acoes
}

beforeEach(() => hookMock.mockReset())
afterEach(cleanup)

describe('Habilidades (admin) — exemplo de descrição', () => {
  it('o formulário de nova categoria tem o campo do exemplo, obrigatório', () => {
    montar()
    render(<GestaoHabilidades />)
    const campo = screen.getByLabelText(/exemplo de descrição do trabalho/i) as HTMLTextAreaElement
    expect(campo.required).toBe(true)
    expect(screen.getByText(/obrigatório em toda categoria nova/i)).toBeTruthy()
  })

  it('cadastrar envia o exemplo junto com a categoria', async () => {
    const acoes = montar()
    render(<GestaoHabilidades />)
    fireEvent.change(screen.getByPlaceholderText(/ex\.: instalação elétrica/i), { target: { value: 'Salgados' } })
    fireEvent.change(screen.getByLabelText(/^grupo$/i), { target: { value: 'g1' } })
    fireEvent.change(screen.getByLabelText(/exemplo de descrição do trabalho/i), { target: { value: 'Cento de salgados para festa de 30 convidados.' } })
    fireEvent.click(screen.getByRole('button', { name: /cadastrar categoria/i }))
    await waitFor(() => expect(acoes.adicionarCategoria).toHaveBeenCalledWith('Salgados', 'g1', false, 'Cento de salgados para festa de 30 convidados.'))
  })

  it('mostra o exemplo de cada categoria e avisa as que estão sem exemplo', () => {
    montar()
    render(<GestaoHabilidades />)
    expect(screen.getByText(/bolo de dois andares/i)).toBeTruthy()
    expect(screen.getByText('Sem exemplo')).toBeTruthy()
    expect(screen.getByText('1 sem exemplo')).toBeTruthy()
  })

  it('dá para escrever o exemplo de uma categoria existente', async () => {
    const acoes = montar()
    render(<GestaoHabilidades />)
    fireEvent.click(screen.getByRole('button', { name: /escrever exemplo/i }))
    fireEvent.change(screen.getByLabelText(/exemplo de descrição de categoria nova/i), { target: { value: 'Frase de exemplo para a categoria nova.' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar exemplo/i }))
    await waitFor(() => expect(acoes.salvarExemplo).toHaveBeenCalledWith('c2', 'Frase de exemplo para a categoria nova.'))
    expect(await screen.findByText('Exemplo salvo.')).toBeTruthy()
  })

  it('erro ao salvar o exemplo aparece em linguagem simples', async () => {
    const acoes = montar()
    acoes.salvarExemplo.mockResolvedValue({ ok: false, error: 'Sem permissão para salvar. Verifique as políticas de acesso do Supabase.' })
    render(<GestaoHabilidades />)
    fireEvent.click(screen.getByRole('button', { name: /editar exemplo/i }))
    fireEvent.click(screen.getByRole('button', { name: /salvar exemplo/i }))
    expect(await screen.findByText(/sem permissão para salvar/i)).toBeTruthy()
  })
})
