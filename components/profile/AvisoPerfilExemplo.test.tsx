import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { AvisoPerfilExemplo } from '@/components/profile/AvisoPerfilExemplo'

afterEach(cleanup)

describe('AvisoPerfilExemplo', () => {
  it('avisa que é exemplo e leva ao cadastro', () => {
    render(<AvisoPerfilExemplo />)
    expect(screen.getByTestId('aviso-perfil-exemplo').textContent).toMatch(/perfil de exemplo/i)
    expect(screen.getByRole('link', { name: /criar meu perfil/i }).getAttribute('href')).toBe('/cadastro')
  })
})
