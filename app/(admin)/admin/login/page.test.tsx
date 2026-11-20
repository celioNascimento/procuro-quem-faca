import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const push = vi.hoisted(() => vi.fn())
const servico = vi.hoisted(() => ({ loginAdmin: vi.fn(), enviarLinkDeNovaSenha: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))
vi.mock('@/components/Logo', () => ({ default: () => <div data-testid="logo-pqf" /> }))
vi.mock('@/lib/services/adminAuth.service', () => servico)

import LoginPage from '@/app/(admin)/admin/login/page'

function preencher(email: string, senha: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha', { exact: true }), { target: { value: senha } })
}

describe('Login do painel administrativo', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('usa o logo do PQF, título simples e rótulos em linguagem comum', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('logo-pqf')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Painel administrativo' })).toBeTruthy()
    expect(screen.getByLabelText('E-mail').getAttribute('autocomplete')).toBe('email')
    expect(screen.getByLabelText('Senha', { exact: true }).getAttribute('autocomplete')).toBe('current-password')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Voltar ao site/ }).getAttribute('href')).toBe('/')
  })

  it('não tem mais os textos de "terminal" nem a afirmação de criptografia', () => {
    render(<LoginPage />)
    expect(document.body.textContent).not.toMatch(/Terminal|Secure Core|Encrypted|Entrar no Sistema/i)
  })

  it('mostra e oculta a senha', () => {
    render(<LoginPage />)
    const campo = screen.getByLabelText('Senha', { exact: true })
    expect(campo.getAttribute('type')).toBe('password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(campo.getAttribute('type')).toBe('text')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(campo.getAttribute('type')).toBe('password')
  })

  it('entra e leva ao painel quando o login dá certo', async () => {
    servico.loginAdmin.mockResolvedValue(null)
    render(<LoginPage />)
    preencher('admin@pqf.com.br', 'segredo')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'))
    expect(servico.loginAdmin).toHaveBeenCalledWith('admin@pqf.com.br', 'segredo')
  })

  it('mostra o erro em texto simples e não sai da tela quando o login falha', async () => {
    servico.loginAdmin.mockResolvedValue('Esta conta não tem acesso ao painel.')
    render(<LoginPage />)
    preencher('cliente@pqf.com.br', 'segredo')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Esta conta não tem acesso ao painel.')).toBeTruthy()
    expect(push).not.toHaveBeenCalled()
  })

  it('"Esqueci minha senha" sem e-mail pede o e-mail e não envia nada', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
    expect(await screen.findByText(/Digite o seu e-mail/)).toBeTruthy()
    expect(servico.enviarLinkDeNovaSenha).not.toHaveBeenCalled()
  })

  it('"Esqueci minha senha" com e-mail envia o link e responde sem revelar se a conta existe', async () => {
    servico.enviarLinkDeNovaSenha.mockResolvedValue(null)
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'admin@pqf.com.br' } })
    fireEvent.click(screen.getByRole('button', { name: 'Esqueci minha senha' }))
    expect(await screen.findByText(/Se este e-mail estiver cadastrado/)).toBeTruthy()
    expect(servico.enviarLinkDeNovaSenha).toHaveBeenCalledWith('admin@pqf.com.br', window.location.origin)
  })
})
