import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const svc = vi.hoisted(() => ({ fatorConfirmado: vi.fn(), iniciarCadastro: vi.fn(), confirmarCodigo: vi.fn(), removerFator: vi.fn() }))
vi.mock('@/lib/services/adminMfa.service', () => svc)
// A lista da equipe tem teste próprio (EquipeAdmin.test.tsx)
vi.mock('@/components/admin/seguranca/EquipeAdmin', () => ({ EquipeAdmin: () => null }))

import { SegurancaConta } from './SegurancaConta'

const CADASTRO = { factorId: 'f9', qrCode: 'data:image/svg+xml;utf8,<svg/>', segredo: 'ABCD EFGH' }

describe('Segurança da conta do admin', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('sem aplicativo cadastrado, mostra "Desligada" e o botão para ligar', async () => {
    svc.fatorConfirmado.mockResolvedValue(null)
    render(<SegurancaConta />)
    expect(await screen.findByText('Desligada')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ligar verificação em duas etapas' })).toBeTruthy()
  })

  it('cadastro obrigatório: mostra o aviso só para quem ainda não ligou', async () => {
    svc.fatorConfirmado.mockResolvedValue(null)
    render(<SegurancaConta obrigatorio />)
    expect(await screen.findByTestId('aviso-obrigatorio')).toBeTruthy()
    cleanup()
    svc.fatorConfirmado.mockResolvedValue('f9')
    render(<SegurancaConta obrigatorio />)
    expect(await screen.findByText('Ligada')).toBeTruthy()
    expect(screen.queryByTestId('aviso-obrigatorio')).toBeNull()
  })

  it('cadastra: mostra o QR code e a chave, confirma com o código e passa a "Ligada"', async () => {
    svc.fatorConfirmado.mockResolvedValueOnce(null).mockResolvedValueOnce('f9')
    svc.iniciarCadastro.mockResolvedValue(CADASTRO)
    svc.confirmarCodigo.mockResolvedValue(null)
    render(<SegurancaConta />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ligar verificação em duas etapas' }))
    expect(await screen.findByAltText(/QR code/)).toBeTruthy()
    expect(screen.getByTestId('chave-manual').textContent).toBe('ABCD EFGH')

    fireEvent.change(screen.getByLabelText(/Digite o código de 6 números/), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e ligar' }))
    expect(await screen.findByText('Ligada')).toBeTruthy()
    expect(svc.confirmarCodigo).toHaveBeenCalledWith('f9', '123456')
  })

  it('código errado mostra o erro e continua no cadastro', async () => {
    svc.fatorConfirmado.mockResolvedValue(null)
    svc.iniciarCadastro.mockResolvedValue(CADASTRO)
    svc.confirmarCodigo.mockResolvedValue('Código incorreto ou vencido.')
    render(<SegurancaConta />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ligar verificação em duas etapas' }))
    fireEvent.change(await screen.findByLabelText(/Digite o código de 6 números/), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar e ligar' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/Código incorreto/)
    expect(screen.queryByText('Ligada')).toBeNull()
  })

  it('cancelar o cadastro descarta o aplicativo não confirmado', async () => {
    svc.fatorConfirmado.mockResolvedValue(null)
    svc.iniciarCadastro.mockResolvedValue(CADASTRO)
    svc.removerFator.mockResolvedValue(true)
    render(<SegurancaConta />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ligar verificação em duas etapas' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(svc.removerFator).toHaveBeenCalledWith('f9'))
    expect(await screen.findByText('Desligada')).toBeTruthy()
  })

  it('desativar pede confirmação antes de remover', async () => {
    svc.fatorConfirmado.mockResolvedValueOnce('f1').mockResolvedValueOnce(null)
    svc.removerFator.mockResolvedValue(true)
    render(<SegurancaConta />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
    expect(svc.removerFator).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, desativar' }))
    await waitFor(() => expect(svc.removerFator).toHaveBeenCalledWith('f1'))
    expect(await screen.findByText('Desligada')).toBeTruthy()
  })

  it('projeto sem o recurso liberado mostra a mensagem simples', async () => {
    svc.fatorConfirmado.mockResolvedValue(null)
    svc.iniciarCadastro.mockRejectedValue(new Error('A verificação em duas etapas não está liberada para este projeto. Avise o suporte técnico.'))
    render(<SegurancaConta />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ligar verificação em duas etapas' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/não está liberada/)
  })
})
