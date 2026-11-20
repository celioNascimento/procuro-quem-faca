import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const estado = vi.hoisted(() => ({
  valor: { session: null, role: null, prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() } as Record<string, unknown>,
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => estado.valor }))
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }))
vi.mock('@/hooks/useAvatarConta', () => ({ useAvatarConta: () => avatar.url }))

import { HeaderAuthButton } from '@/components/HeaderAuthButton'

const avatar = vi.hoisted(() => ({ url: '' }))

const sessao = { user: { id: 'u1', user_metadata: {} } }

describe('HeaderAuthButton', () => {
  afterEach(() => {
    cleanup()
    avatar.url = ''
  })

  it('cliente vê só a Área do cliente, sem atalho para a área do profissional', () => {
    estado.valor = { session: sessao, role: 'cliente', prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getByRole('link', { name: 'Área do cliente' }).getAttribute('href')).toBe('/painel/perfil')
    expect(screen.queryByRole('link', { name: 'Área do profissional' })).toBeNull()
  })

  it('profissional com cadastro completo acessa a área do profissional e a área do cliente', () => {
    estado.valor = { session: sessao, role: 'prestador', prestadorStatus: 'ativo', loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getAllByRole('link', { name: 'Área do profissional' })[0].getAttribute('href')).toBe('/dashboard')
    expect(screen.getByRole('link', { name: 'Área do cliente' }).getAttribute('href')).toBe('/painel/perfil')
  })

  it('profissional com cadastro pendente vê Concluir cadastro e a área do cliente', () => {
    estado.valor = { session: sessao, role: 'prestador', prestadorStatus: 'pendente', loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getAllByRole('link', { name: 'Concluir cadastro' })[0].getAttribute('href')).toBe('/cadastro')
    expect(screen.getByRole('link', { name: 'Área do cliente' }).getAttribute('href')).toBe('/painel/perfil')
  })

  it('o menu da conta (celular) leva ao feed, para cliente e para profissional', () => {
    for (const role of ['cliente', 'prestador']) {
      estado.valor = { session: sessao, role, prestadorStatus: role === 'prestador' ? 'ativo' : null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
      const { unmount } = render(<HeaderAuthButton />)
      expect(screen.queryByTestId('menu-link-feed')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Abrir menu da conta' }))
      const link = screen.getByTestId('menu-link-feed')
      expect(link.getAttribute('href')).toBe('/feed')
      expect(link.textContent).toContain('Feed de trabalhos')
      unmount()
    }
  })

  it('na página do feed o item do menu fica marcado como atual', () => {
    estado.valor = { session: sessao, role: 'cliente', prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton feedAtivo />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu da conta' }))
    expect(screen.getByTestId('menu-link-feed').getAttribute('aria-current')).toBe('page')
  })

  it('visitante não tem menu de conta: só o Entrar', () => {
    estado.valor = { session: null, role: null, prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy()
    expect(screen.queryByTestId('menu-link-feed')).toBeNull()
  })

  it('mostra a foto da conta no avatar, no computador e no celular', () => {
    avatar.url = 'https://lh3.googleusercontent.com/foto.jpg'
    estado.valor = { session: sessao, role: 'cliente', prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    const fotos = screen.getAllByAltText('Sua foto')
    expect(fotos).toHaveLength(2)
    for (const foto of fotos) {
      expect(foto.getAttribute('src')).toBe('https://lh3.googleusercontent.com/foto.jpg')
      expect(foto.getAttribute('referrerpolicy')).toBe('no-referrer')
      expect(foto.className).toContain('object-contain')
      expect(foto.className).not.toContain('object-cover')
    }
  })

  it('sem foto, o avatar mostra o ícone de usuário', () => {
    estado.valor = { session: sessao, role: 'cliente', prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    expect(screen.queryByAltText('Sua foto')).toBeNull()
    expect(screen.getAllByTestId('avatar-conta-icone')).toHaveLength(2)
  })

  it('se a foto não carrega, o avatar cai para o ícone em vez de ficar vazio', () => {
    avatar.url = 'https://lh3.googleusercontent.com/quebrada.jpg'
    estado.valor = { session: sessao, role: 'cliente', prestadorStatus: null, loading: false, erroLogin: false, loginGoogle: vi.fn() }
    render(<HeaderAuthButton />)
    for (const foto of screen.getAllByAltText('Sua foto')) fireEvent.error(foto)
    expect(screen.queryByAltText('Sua foto')).toBeNull()
    expect(screen.getAllByTestId('avatar-conta-icone')).toHaveLength(2)
  })
})
