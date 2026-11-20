import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AdminPrestador } from '@/types/adminPrestadores'

const servico = vi.hoisted(() => ({ bloquear: vi.fn(), desbloquear: vi.fn() }))
vi.mock('@/lib/services/denuncia.service', () => ({
  bloquearPrestadorDenunciado: servico.bloquear,
  desbloquearPrestador: servico.desbloquear,
}))

import { BloqueioPrestador } from './BloqueioPrestador'

const item = { id: 9, nome: 'Ana', bloqueado: false } as AdminPrestador

describe('BloqueioPrestador', () => {
  afterEach(() => { cleanup(); servico.bloquear.mockReset(); servico.desbloquear.mockReset() })

  it('começa só com o botão; o formulário de motivo aparece ao clicar', () => {
    render(<BloqueioPrestador item={item} aoConcluir={vi.fn()} />)
    expect(screen.queryByLabelText(/Motivo do bloqueio/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Bloquear perfil/ }))
    expect(screen.getByLabelText(/Motivo do bloqueio/)).toBeTruthy()
  })

  it('confirmar sem motivo não chama o banco e explica o que falta', async () => {
    render(<BloqueioPrestador item={item} aoConcluir={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Bloquear perfil/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar bloqueio' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Escreva o motivo/))
    expect(servico.bloquear).not.toHaveBeenCalled()
  })

  it('com motivo, bloqueia e avisa a tela', async () => {
    servico.bloquear.mockResolvedValue(undefined)
    const aoConcluir = vi.fn()
    render(<BloqueioPrestador item={item} aoConcluir={aoConcluir} />)
    fireEvent.click(screen.getByRole('button', { name: /Bloquear perfil/ }))
    fireEvent.change(screen.getByLabelText(/Motivo do bloqueio/), { target: { value: 'Golpe relatado por dois clientes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar bloqueio' }))
    await waitFor(() => expect(aoConcluir).toHaveBeenCalledWith(9, true))
    expect(servico.bloquear).toHaveBeenCalledWith(9, 'Golpe relatado por dois clientes')
  })

  it('cancelar fecha o formulário sem bloquear', () => {
    render(<BloqueioPrestador item={item} aoConcluir={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Bloquear perfil/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText(/Motivo do bloqueio/)).toBeNull()
    expect(servico.bloquear).not.toHaveBeenCalled()
  })

  it('perfil já bloqueado mostra o aviso e oferece desbloquear', async () => {
    servico.desbloquear.mockResolvedValue(undefined)
    const aoConcluir = vi.fn()
    render(<BloqueioPrestador item={{ ...item, bloqueado: true }} aoConcluir={aoConcluir} />)
    expect(screen.getByText('Perfil bloqueado')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Bloquear perfil/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Desbloquear perfil' }))
    await waitFor(() => expect(aoConcluir).toHaveBeenCalledWith(9, false))
  })
})
