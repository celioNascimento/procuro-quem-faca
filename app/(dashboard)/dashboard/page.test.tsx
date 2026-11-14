import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('') }))
vi.mock('@/hooks/usePerfilStatus', () => ({ usePerfilStatus: () => ({ cadastroCompleto: true, validando: false, slug: 'ana', prestadorId: 7, bloqueado: false, motivoBloqueio: null }) }))
vi.mock('@/components/dashboard/EditarPerfilTab', () => ({ default: () => <div>ABA-PERFIL</div> }))
vi.mock('@/components/dashboard/PortfolioDashboardTab', () => ({ default: () => <div>ABA-TRABALHOS</div> }))
vi.mock('@/components/dashboard/DesempenhoDashboardTab', () => ({ default: () => <div>ABA-DESEMPENHO</div> }))
vi.mock('@/components/dashboard/CentralDivulgacaoTab', () => ({ default: () => <div>ABA-DIVULGACAO</div> }))
vi.mock('@/components/dashboard/AdCardDashboard', () => ({ AdCardDashboard: () => null }))
vi.mock('@/components/dashboard/ResumoDesempenhoStrip', () => ({ ResumoDesempenhoStrip: () => null }))
vi.mock('@/components/help/HelpCenter', () => ({ ContextualHelp: ({ context }: { context: string }) => <div data-testid="ajuda">{context}</div> }))

import PerfilPage from '@/app/(dashboard)/dashboard/page'

afterEach(cleanup)

describe('Painel do prestador — central de ajuda', () => {
  it.each([
    ['Meus Trabalhos', 'dashboard-prestador'],
    ['Desempenho', 'dashboard-prestador'],
    ['Dados Profissionais', 'dashboard-prestador'],
    ['Divulgação', 'divulgacao'],
  ])('na aba %s aparece um único bloco de ajuda (%s)', (aba, contexto) => {
    render(<PerfilPage />)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(aba) }))
    const blocos = screen.getAllByTestId('ajuda')
    expect(blocos).toHaveLength(1)
    expect(blocos[0].textContent).toBe(contexto)
  })
})
