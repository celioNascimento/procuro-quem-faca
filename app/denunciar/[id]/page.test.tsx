import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({ query: '', criar: vi.fn() }))
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '7' }),
  useSearchParams: () => new URLSearchParams(h.query),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/denunciar/7',
}))
vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/hooks/useVoltar', () => ({ useVoltar: () => vi.fn() }))
vi.mock('@/lib/services/denuncia.service', () => ({ criarDenuncia: h.criar }))

import PaginaDenuncia from './page'

const ID = '11111111-1111-4111-8111-111111111111'
beforeEach(() => { h.criar.mockReset().mockResolvedValue(undefined); h.query = '' })
afterEach(cleanup)

async function enviar(texto: string) {
  fireEvent.change(screen.getByPlaceholderText(/descreva o problema/i), { target: { value: texto } })
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar Denúncia' }))
  await waitFor(() => expect(h.criar).toHaveBeenCalled())
}

describe('página de denúncia', () => {
  it('do perfil (sem trabalho no endereço): denuncia só o prestador, motivo como digitado', async () => {
    render(<PaginaDenuncia />)
    expect(screen.queryByTestId('denuncia-trabalho')).toBeNull()
    await enviar('Perfil falso')
    expect(h.criar).toHaveBeenCalledWith(7, 'Perfil falso')
  })
  it('do feed: mostra o trabalho e o cita no motivo', async () => {
    h.query = `trabalho=${ID}&titulo=Reforma%20de%20varanda`
    render(<PaginaDenuncia />)
    expect(screen.getByTestId('denuncia-trabalho').textContent).toContain('Reforma de varanda')
    await enviar('Foto de outra obra')
    expect(h.criar).toHaveBeenCalledWith(7, `Sobre o trabalho "Reforma de varanda" (id ${ID}): Foto de outra obra`)
  })
  it('id de trabalho adulterado é ignorado', () => {
    h.query = `trabalho=1%27%20or%201=1&titulo=x`
    render(<PaginaDenuncia />)
    expect(screen.queryByTestId('denuncia-trabalho')).toBeNull()
  })
})
