import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SeguirPrestador } from './SeguirPrestador'

afterEach(cleanup)
const base = { totalSeguidores: 12, seguindo: false, logado: true, aviso: null, onSeguir: () => {} }

describe('SeguirPrestador', () => {
  it('mostra Seguir com o total ao lado', () => {
    render(<SeguirPrestador {...base} />)
    expect(screen.getByTestId('perfil-seguir').textContent).toMatch(/Seguir/)
    expect(screen.getByTestId('perfil-seguidores').textContent).toMatch(/12 seguidores/)
  })
  it('sem seguidores mostra só Seguir; seguindo mostra Seguindo', () => {
    const { rerender } = render(<SeguirPrestador {...base} totalSeguidores={0} />)
    expect(screen.queryByTestId('perfil-seguidores')).toBeNull()
    rerender(<SeguirPrestador {...base} seguindo />)
    expect(screen.getByTestId('perfil-seguir').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('perfil-seguir').textContent).toMatch(/Seguindo/)
  })
  it('tocar chama onSeguir', () => {
    const onSeguir = vi.fn()
    render(<SeguirPrestador {...base} onSeguir={onSeguir} />)
    fireEvent.click(screen.getByTestId('perfil-seguir'))
    expect(onSeguir).toHaveBeenCalledTimes(1)
  })
  it('visitante com aviso vê o link Entrar; logado com erro não vê', () => {
    const { rerender } = render(<SeguirPrestador {...base} logado={false} aviso="Entre na sua conta para curtir." />)
    expect(screen.getByRole('link', { name: 'Entrar' }).getAttribute('href')).toBe('/login')
    rerender(<SeguirPrestador {...base} aviso="Não conseguimos concluir agora." />)
    expect(screen.queryByRole('link', { name: 'Entrar' })).toBeNull()
    expect(screen.getByTestId('perfil-aviso')).toBeTruthy()
  })
})
