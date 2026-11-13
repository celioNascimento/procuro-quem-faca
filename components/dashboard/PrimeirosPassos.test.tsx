import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { PrimeirosPassos } from '@/components/dashboard/PrimeirosPassos'

const base = {
  slug: 'ana-pintora',
  temFotosNaVitrine: false,
  temTrabalhos: false,
  onAdicionarFotos: vi.fn(),
  onAdicionarTrabalho: vi.fn(),
}

function simularAreaDeTransferencia(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
})
afterEach(cleanup)

describe('PrimeirosPassos', () => {
  it('perfil novo: mostra 1 de 3 feitos e os botões dos passos que faltam', async () => {
    render(<PrimeirosPassos {...base} />)

    expect(await screen.findByText(/1 de 3 feitos/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /copiar link do perfil/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /adicionar fotos/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /adicionar trabalho/i })).toBeTruthy()
  })

  it('os botões chamam as ações certas', async () => {
    render(<PrimeirosPassos {...base} />)

    fireEvent.click(await screen.findByRole('button', { name: /adicionar fotos/i }))
    fireEvent.click(screen.getByRole('button', { name: /adicionar trabalho/i }))
    expect(base.onAdicionarFotos).toHaveBeenCalledTimes(1)
    expect(base.onAdicionarTrabalho).toHaveBeenCalledTimes(1)
  })

  it('passo concluído não oferece botão de novo', async () => {
    render(<PrimeirosPassos {...base} temFotosNaVitrine />)

    expect(await screen.findByText(/2 de 3 feitos/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /adicionar fotos/i })).toBeNull()
    expect(screen.getByRole('button', { name: /adicionar trabalho/i })).toBeTruthy()
  })

  it('copiar link grava o endereço do perfil na área de transferência e confirma', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    simularAreaDeTransferencia(writeText)
    render(<PrimeirosPassos {...base} />)

    fireEvent.click(await screen.findByRole('button', { name: /copiar link do perfil/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(writeText.mock.calls[0][0]).toMatch(/\/ana-pintora$/)
    expect(await screen.findByRole('button', { name: /link copiado/i })).toBeTruthy()
  })

  it('se a cópia falhar, mostra o link para a pessoa copiar na mão', async () => {
    simularAreaDeTransferencia(vi.fn().mockRejectedValue(new Error('negado')))
    render(<PrimeirosPassos {...base} />)

    fireEvent.click(await screen.findByRole('button', { name: /copiar link do perfil/i }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/ana-pintora/)
  })

  it('"Agora não" some com o cartão e lembra da escolha', async () => {
    const { unmount } = render(<PrimeirosPassos {...base} />)
    fireEvent.click(await screen.findByRole('button', { name: /agora não/i }))
    expect(screen.queryByText(/primeiros passos/i)).toBeNull()
    unmount()

    render(<PrimeirosPassos {...base} />)
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByText(/primeiros passos/i)).toBeNull()
  })

  it('com os três passos feitos, o cartão não aparece', async () => {
    render(<PrimeirosPassos {...base} temFotosNaVitrine temTrabalhos />)
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByText(/primeiros passos/i)).toBeNull()
  })
})
