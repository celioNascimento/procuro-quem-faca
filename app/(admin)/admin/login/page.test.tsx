import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const push = vi.hoisted(() => vi.fn())
const servico = vi.hoisted(() => ({ loginAdmin: vi.fn(), enviarLinkDeNovaSenha: vi.fn(), sairDaConta: vi.fn() }))
const mfa = vi.hoisted(() => ({ nivelDeAcesso: vi.fn(), fatorConfirmado: vi.fn(), confirmarCodigo: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }))
vi.mock('@/components/Logo', () => ({ default: () => <div data-testid="logo-pqf" /> }))
vi.mock('@/lib/services/adminAuth.service', () => servico)
vi.mock('@/lib/services/adminMfa.service', () => mfa)

import LoginPage from '@/app/(admin)/admin/login/page'

function preencher(email: string, senha: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha', { exact: true }), { target: { value: senha } })
}

describe('Login do painel administrativo', () => {
  beforeEach(() => { mfa.nivelDeAcesso.mockResolvedValue({ currentLevel: 'aal1', nextLevel: 'aal1' }) })
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

  describe('verificação em duas etapas', () => {
    async function ateOCodigo() {
      servico.loginAdmin.mockResolvedValue(null)
      mfa.nivelDeAcesso.mockResolvedValue({ currentLevel: 'aal1', nextLevel: 'aal2' })
      mfa.fatorConfirmado.mockResolvedValue('f1')
      render(<LoginPage />)
      preencher('admin@pqf.com.br', 'segredo')
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
      await screen.findByRole('heading', { name: 'Confirme que é você' })
    }

    it('conta com aplicativo cadastrado pede o código antes de abrir o painel', async () => {
      await ateOCodigo()
      expect(push).not.toHaveBeenCalled()
      expect(screen.getByLabelText('Código do aplicativo').getAttribute('autocomplete')).toBe('one-time-code')
    })

    it('código certo abre o painel', async () => {
      await ateOCodigo()
      mfa.confirmarCodigo.mockResolvedValue(null)
      fireEvent.change(screen.getByLabelText('Código do aplicativo'), { target: { value: '123 456' } })
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
      await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'))
      expect(mfa.confirmarCodigo).toHaveBeenCalledWith('f1', '123456')
    })

    it('código incompleto não chama o servidor; código errado mostra o erro e não abre', async () => {
      await ateOCodigo()
      fireEvent.change(screen.getByLabelText('Código do aplicativo'), { target: { value: '123' } })
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
      await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/6 números/))
      expect(mfa.confirmarCodigo).not.toHaveBeenCalled()

      mfa.confirmarCodigo.mockResolvedValue('Código incorreto ou vencido. Confira o código atual no aplicativo e tente de novo.')
      fireEvent.change(screen.getByLabelText('Código do aplicativo'), { target: { value: '654321' } })
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
      await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Código incorreto ou vencido/))
      expect(push).not.toHaveBeenCalled()
    })

    it('"Voltar" encerra a sessão parcial e volta para a senha', async () => {
      await ateOCodigo()
      fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
      await screen.findByRole('heading', { name: 'Painel administrativo' })
      expect(servico.sairDaConta).toHaveBeenCalled()
    })

    it('se não der para saber o nível de acesso, não entra: sai da conta e avisa', async () => {
      servico.loginAdmin.mockResolvedValue(null)
      mfa.nivelDeAcesso.mockRejectedValue(new Error('falha'))
      render(<LoginPage />)
      preencher('admin@pqf.com.br', 'segredo')
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
      expect(await screen.findByText(/Não foi possível entrar agora/)).toBeTruthy()
      expect(servico.sairDaConta).toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
    })
  })
})

