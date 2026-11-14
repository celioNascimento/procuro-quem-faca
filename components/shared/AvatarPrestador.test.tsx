import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AvatarPrestador from '@/components/shared/AvatarPrestador'

describe('AvatarPrestador', () => {
  it('com foto mostra a foto', () => {
    render(<AvatarPrestador foto="https://x/foto.png" nome="Ana Souza" />)
    expect(screen.getByRole('img', { name: /foto de ana souza/i }).getAttribute('src')).toBe('https://x/foto.png')
  })

  it('sem foto não usa imagem nenhuma (nada de arquivo inexistente): mostra o ícone da área', () => {
    const { container } = render(<AvatarPrestador nome="Ana Souza" categoria={{ categorias_grupos: { icone: 'hammer' } }} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByRole('img', { name: /sem foto de ana souza/i })).toBeTruthy()
  })

  it('aceita o grupo vindo como lista de um item', () => {
    const { container } = render(<AvatarPrestador nome="Ana" categoria={{ categorias_grupos: [{ icone: 'heart' }] }} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('sem foto e sem ícone conhecido mostra as iniciais', () => {
    render(<AvatarPrestador nome="Ana Souza" categoria={null} />)
    expect(document.body.textContent).toContain('AS')
  })

  it('foto que não carrega cai para o ícone/iniciais', () => {
    const { container } = render(<AvatarPrestador foto="https://x/quebrada.png" nome="Ana Souza" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(document.body.textContent).toContain('AS')
  })
})
