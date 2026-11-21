import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const servico = vi.hoisted(() => ({ carregar: vi.fn(), adicionar: vi.fn(), remover: vi.fn() }))
vi.mock('@/lib/services/adminEquipe.service', () => ({
  carregarEquipe: servico.carregar, adicionarAdmin: servico.adicionar, removerAdmin: servico.remover,
}))

import { normalizarEquipe } from '@/lib/admin/equipe'
import { EquipeAdmin } from './EquipeAdmin'

afterEach(() => { cleanup(); Object.values(servico).forEach((f) => f.mockReset()) })

// O serviço real já devolve a equipe normalizada
const equipe = (euDono = true) => normalizarEquipe({
  eu_dono: euDono, meu_id: 'u1',
  membros: [
    { user_id: 'u1', email: 'celio.gih@gmail.com', role: 'owner', desde: null, ultimo_acesso: '2026-11-21T10:00:00Z', duas_etapas: true },
    { user_id: 'u2', email: 'procuroquemfaca@gmail.com', role: 'editor', desde: null, ultimo_acesso: null, duas_etapas: false },
  ],
})

describe('EquipeAdmin', () => {
  it('lista a equipe, marca "você" e lembra de quem está sem duas etapas', async () => {
    servico.carregar.mockResolvedValue(equipe())
    render(<EquipeAdmin />)
    await waitFor(() => expect(screen.getAllByTestId('equipe-membro')).toHaveLength(2))
    const [eu, outra] = screen.getAllByTestId('equipe-membro')
    expect(within(eu).getByText(/celio.gih@gmail.com \(você\)/)).toBeTruthy()
    expect(within(eu).queryByRole('button', { name: 'Tirar da equipe' })).toBeNull()
    expect(within(outra).getByText('Sem duas etapas')).toBeTruthy()
    expect(screen.getByTestId('equipe-lembrete').textContent).toContain('procuroquemfaca@gmail.com')
  })

  it('adiciona por e-mail e mostra o erro em linguagem simples quando não há conta', async () => {
    servico.carregar.mockResolvedValue(equipe())
    servico.adicionar.mockResolvedValueOnce('sem_conta').mockResolvedValueOnce('ok')
    render(<EquipeAdmin />)
    await waitFor(() => screen.getByLabelText('Adicionar pessoa'))
    fireEvent.change(screen.getByLabelText('Adicionar pessoa'), { target: { value: 'nova@x.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar à equipe' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('ainda não tem conta'))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar à equipe' }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Pessoa adicionada'))
    expect(servico.adicionar).toHaveBeenCalledWith('nova@x.com')
  })

  it('remover pede confirmação antes de chamar o banco', async () => {
    servico.carregar.mockResolvedValue(equipe())
    servico.remover.mockResolvedValue('ok')
    render(<EquipeAdmin />)
    await waitFor(() => screen.getByRole('button', { name: 'Tirar da equipe' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tirar da equipe' }))
    expect(servico.remover).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, tirar' }))
    await waitFor(() => expect(servico.remover).toHaveBeenCalledWith('u2'))
  })

  it('quem não é dono não vê adicionar nem remover', async () => {
    servico.carregar.mockResolvedValue(equipe(false))
    render(<EquipeAdmin />)
    await waitFor(() => screen.getAllByTestId('equipe-membro'))
    expect(screen.queryByLabelText('Adicionar pessoa')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tirar da equipe' })).toBeNull()
    expect(screen.getByText(/Só o dono da equipe/)).toBeTruthy()
  })
})
