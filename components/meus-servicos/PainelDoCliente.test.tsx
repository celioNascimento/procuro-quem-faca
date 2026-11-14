import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const h = vi.hoisted(() => ({ valor: {} as Record<string, unknown>, token: 'tok-1', push: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: h.push }),
  useSearchParams: () => ({ get: () => h.token }),
}))
vi.mock('@/hooks/usePainelCliente', () => ({ usePainelCliente: () => h.valor }))
vi.mock('@/components/perfil/HeaderCliente', () => ({ default: () => null }))
vi.mock('@/components/painel/AdCardPainelCliente', () => ({ AdCardPainelCliente: () => null }))
vi.mock('@/components/help/HelpCenter', () => ({ ContextualHelp: () => null }))
vi.mock('@/components/skeletons/PainelDoClienteSkeleton', () => ({ default: () => null }))
vi.mock('./LoginGate', () => ({ default: () => <div data-testid="login" /> }))

import PainelDoCliente from './PainelDoCliente'

const servico = {
  id: 's1', titulo: 'Pintura da sala', status: 'pendente', avaliacao_token: 'tok-1',
  sem_fotos: true, marcado_concluido_at: null, portfolio_fotos: [], solicitacoes_garantia: [], avaliacoes: [],
  prestadores: { id: 'p1', nome: 'João Pintor', foto_perfil: null, whatsapp: '43999990000', categoria: { nome: 'Pintor', categorias_grupos: { icone: 'hammer' } } },
}

function base(extra: Record<string, unknown> = {}) {
  return {
    session: { user: { id: 'u' } }, servicos: [servico], servicosGarantia: [], servicosReclamacao: [], loading: false,
    zoomImage: null, setZoomImage: vi.fn(), tokenUrl: 'tok-1', nomeCliente: 'Ana',
    handleAceitar: vi.fn(), handleRecusar: vi.fn(), handleVerGarantia: vi.fn(), acaoEmAndamento: false, erroAcao: null,
    ...extra,
  }
}

describe('PainelDoCliente — recusar trabalho', () => {
  beforeEach(() => { window.scrollTo = vi.fn() as unknown as typeof window.scrollTo; h.valor = base() })

  it('abre um diálogo (sem janela do navegador) e só recusa depois de confirmar', () => {
    const confirmNativo = vi.fn()
    window.confirm = confirmNativo
    const handleRecusar = vi.fn()
    h.valor = base({ handleRecusar })
    render(<PainelDoCliente />)

    fireEvent.click(screen.getByRole('button', { name: 'Recusar trabalho' }))
    expect(confirmNativo).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Recusar este trabalho?' })).toBeTruthy()
    expect(handleRecusar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Sim, recusar' }))
    expect(handleRecusar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"Voltar" fecha o diálogo sem recusar', () => {
    const handleRecusar = vi.fn()
    h.valor = base({ handleRecusar })
    render(<PainelDoCliente />)
    fireEvent.click(screen.getByRole('button', { name: 'Recusar trabalho' }))
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(handleRecusar).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('sem foto, o profissional aparece com o ícone da área (e não imagem quebrada)', () => {
    render(<PainelDoCliente />)
    expect(screen.getAllByRole('img', { name: 'Sem foto de João Pintor' }).length).toBeGreaterThan(0)
    expect(document.querySelector('img[src="/placeholder-avatar.png"]')).toBeNull()
  })

  it('sem sessão mostra a tela de entrada', () => {
    h.valor = base({ session: null })
    render(<PainelDoCliente />)
    expect(screen.getByTestId('login')).toBeTruthy()
  })
})
