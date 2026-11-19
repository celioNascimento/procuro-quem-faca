import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import PerfilHero from './PerfilHero'
import type { PrestadorPerfil } from '@/types/perfil'

afterEach(cleanup)

const prestador = { id: 7, nome: 'Maria Doceira', foto_perfil: null, bairro: 'Centro', cidades: { nome: 'Londrina' }, categoria: 'Doces' } as unknown as PrestadorPerfil
const social = { totalSeguidores: 12, seguindo: false, logado: true, aviso: null, onSeguir: vi.fn() }

describe('PerfilHero — seguir', () => {
  it('com social: mostra Seguir e o total, e o toque chama onSeguir', () => {
    const onSeguir = vi.fn()
    render(<PerfilHero prestador={prestador} compartilhando={false} onCompartilhar={() => {}} social={{ ...social, onSeguir }} />)
    expect(screen.getByTestId('perfil-seguidores').textContent).toMatch(/12 seguidores/)
    fireEvent.click(screen.getByTestId('perfil-seguir'))
    expect(onSeguir).toHaveBeenCalledTimes(1)
  })
  it('sem social (próprio perfil, exemplo ou bloqueado): não mostra Seguir; Denunciar e Compartilhar continuam', () => {
    render(<PerfilHero prestador={prestador} compartilhando={false} onCompartilhar={() => {}} />)
    expect(screen.queryByTestId('perfil-seguir')).toBeNull()
    expect(screen.getByText('Denunciar')).toBeTruthy()
    expect(screen.getByText('Compartilhar')).toBeTruthy()
  })
})
