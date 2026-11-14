import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }))
const hook = vi.fn()
vi.mock('@/hooks/usePortfolioDashboard', () => ({ usePortfolioDashboard: () => hook() }))
vi.mock('@/components/dashboard/wizard/UploadWizardContainer', () => ({ UploadWizardContainer: () => null }))
vi.mock('@/components/dashboard/VitrineDeFotos', () => ({ VitrineDeFotos: () => null }))
vi.mock('@/components/dashboard/PrimeirosPassos', () => ({ PrimeirosPassos: () => null }))

import PortfolioDashboardTab from '@/components/dashboard/PortfolioDashboardTab'

const base = { projetos: [], loading: false, erro: false, recarregar: vi.fn(), meuPrestadorId: 7, perfilPrestador: { slug: 'ana' }, showWizard: false, projetoParaEdicao: null, totalConcluidos: 0, totalAtivos: 0, abrirEdicao: vi.fn(), abrirNovo: vi.fn(), fecharWizard: vi.fn() }
afterEach(cleanup)

describe('Meus Trabalhos', () => {
  it('sem trabalhos: um único convite para adicionar (não repete o botão em dois blocos)', () => {
    hook.mockReturnValue(base)
    render(<PortfolioDashboardTab />)
    expect(screen.getAllByRole('button', { name: /adicionar (primeiro )?trabalho/i })).toHaveLength(1)
  })

  it('com trabalhos: mostra o resumo com o botão de adicionar', () => {
    hook.mockReturnValue({ ...base, projetos: [{ id: 'p1', titulo: 'Pintura', status: 'em_execucao', created_at: '2026-11-01', portfolio_fotos: [], avaliacoes: [], solicitacoes_garantia: [] }], totalAtivos: 1 })
    render(<PortfolioDashboardTab />)
    expect(screen.getByRole('button', { name: /^adicionar trabalho$/i })).toBeTruthy()
    expect(screen.getByText(/1 trabalho registrado/i)).toBeTruthy()
  })

  it('falha ao carregar NÃO parece "nenhum trabalho": avisa e oferece tentar de novo', () => {
    const recarregar = vi.fn()
    hook.mockReturnValue({ ...base, erro: true, recarregar })
    render(<PortfolioDashboardTab />)
    expect(screen.getByRole('alert').textContent).toMatch(/continuam salvos/i)
    expect(screen.queryByText(/seus trabalhos começam aqui/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))
    expect(recarregar).toHaveBeenCalled()
  })
})
