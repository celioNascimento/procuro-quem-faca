import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Estado devolvido pelo hook: bloqueio com aviso, enquanto a página está no estado "redirecionando"
const estado = {
  form: {}, categorias: {}, loc: {}, slugCheck: {},
  mounted: true, loading: false, enviando: false, uploading: false, isRedirecting: true,
  isModalOpen: false, setIsModalOpen: vi.fn(),
  status: '', tentouEnviar: false, modoEdicao: false,
  userLogado: { id: 'u1' }, email: '', setEmail: vi.fn(), senha: '', setSenha: vi.fn(),
  confirmarSenha: '', setConfirmarSenha: vi.fn(),
  aceitouTermos: false, setAceitouTermos: vi.fn(), aceitouPrivacidade: false, setAceitouPrivacidade: vi.fn(),
  errorModal: { show: true, title: 'Esta conta já tem um perfil', message: 'Cada conta pode ter um perfil profissional.', actionText: 'Ir para o meu perfil', actionUrl: '/dashboard' },
  setErrorModal: vi.fn(),
  handleUploadFotoProcess: vi.fn(), handleExcluirPerfil: vi.fn(), calcularProgresso: () => 0, handleSubmit: vi.fn(), handleLogout: vi.fn(),
}

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('reivindicar=1592&token=e8b6ab23-c614-471b-b685-719d4de48ab5'),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/cadastro',
}))
vi.mock('@/hooks/useCadastroPrestador', () => ({ useCadastroPrestador: () => estado }))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ prestadorStatus: null }) }))
vi.mock('@/components/Header', () => ({ default: () => null }))

import CadastroPage from '@/app/cadastro/page'

describe('página de cadastro durante um bloqueio', () => {
  it('mostra o aviso mesmo com a página no estado "redirecionando" (esqueleto)', () => {
    render(<CadastroPage />)
    expect(screen.getByText('Esta conta já tem um perfil')).toBeTruthy()
    expect(screen.getByText('Ir para o meu perfil')).toBeTruthy()
  })

  it('sem bloqueio, o esqueleto aparece sem modal', () => {
    estado.errorModal = { ...estado.errorModal, show: false }
    render(<CadastroPage />)
    expect(screen.queryByText('Esta conta já tem um perfil')).toBeNull()
  })
})
