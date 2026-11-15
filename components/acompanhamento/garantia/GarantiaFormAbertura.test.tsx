import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({ abrir: vi.fn() }))
vi.mock('@/lib/services/garantia.service', () => ({ abrirCasoGarantiaCliente: (...a: unknown[]) => h.abrir(...a) }))
vi.mock('@/hooks/useGarantiaWizard', () => ({
  useGarantiaWizard: () => ({ state: { fotos: [], enviandoFoto: false }, actions: { handleUpload: vi.fn() } }),
}))
vi.mock('@/components/dashboard/wizard/garantia/FotoGarantia', () => ({ FotoGarantia: () => null }))

import { GarantiaFormAbertura } from './GarantiaFormAbertura'

const monta = () => render(<GarantiaFormAbertura projetoId="p1" clienteUserId="u1" tipo="garantia" onAberto={vi.fn()} />)
beforeEach(() => vi.clearAllMocks())

describe('GarantiaFormAbertura', () => {
  it('avisa que o texto pode aparecer no perfil público quando o caso encerrar', () => {
    monta()
    expect(document.body.textContent).toMatch(/perfil público/)
    expect(document.body.textContent).toMatch(/dados pessoais/i)
  })

  it('exige 20 caracteres, mostra a mensagem do banco quando recusa', async () => {
    h.abrir.mockRejectedValue(new Error('O prazo para abrir este caso já terminou.'))
    monta()
    const enviar = screen.getByRole('button', { name: 'Abrir garantia' }) as HTMLButtonElement
    expect(enviar.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Descreva o problema'), { target: { value: 'A calha voltou a vazar com a chuva.' } })
    expect(enviar.disabled).toBe(false)
    fireEvent.click(enviar)
    expect((await screen.findByRole('alert')).textContent).toContain('O prazo para abrir este caso já terminou.')
  })

  it('caso aberto: segue para anexar fotos', async () => {
    h.abrir.mockResolvedValue({ id: 'caso-1' })
    monta()
    fireEvent.change(screen.getByLabelText('Descreva o problema'), { target: { value: 'A calha voltou a vazar com a chuva.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir garantia' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Concluir abertura' })).toBeTruthy())
    expect(h.abrir).toHaveBeenCalledWith({ projetoId: 'p1', descricaoProblema: 'A calha voltou a vazar com a chuva.' })
  })
})
