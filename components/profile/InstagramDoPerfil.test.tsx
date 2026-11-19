import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { InstagramDoPerfil } from './InstagramDoPerfil'

afterEach(cleanup)

describe('InstagramDoPerfil', () => {
  it('leva ao perfil no Instagram, em nova aba e sem repassar a origem', () => {
    render(<InstagramDoPerfil usuario="pedro.pedreiro" />)
    const link = screen.getByTestId('perfil-instagram')
    expect(link.getAttribute('href')).toBe('https://www.instagram.com/pedro.pedreiro/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent).toContain('@pedro.pedreiro')
  })
  it('sem usuário não mostra nada', () => {
    for (const u of [null, undefined, '']) {
      render(<InstagramDoPerfil usuario={u} />)
      expect(screen.queryByTestId('perfil-instagram')).toBeNull()
      cleanup()
    }
  })
  it('usuário fora do formato (gravado direto no banco) nunca vira link', () => {
    for (const u of ['javascript:alert(1)', 'https://evil.com', 'Pedro', 'a b']) {
      render(<InstagramDoPerfil usuario={u} />)
      expect(screen.queryByTestId('perfil-instagram')).toBeNull()
      cleanup()
    }
  })
})
