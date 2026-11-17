import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

let busca = ''
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(busca) }))
type StatusPerfil = { cadastroCompleto: boolean; validando: boolean; slug: string; prestadorId: number; bloqueado: boolean; motivoBloqueio: string | null }
let status: StatusPerfil = { cadastroCompleto: true, validando: false, slug: 'ana', prestadorId: 7, bloqueado: false, motivoBloqueio: null }
vi.mock('@/hooks/usePerfilStatus', () => ({ usePerfilStatus: () => status }))
vi.mock('@/components/dashboard/dados-profissionais/DadosProfissionaisTabs', () => ({ default: () => <div>ABA-PERFIL</div> }))
vi.mock('@/components/dashboard/PortfolioDashboardTab', () => ({ default: () => <div>ABA-TRABALHOS</div> }))
vi.mock('@/components/dashboard/DesempenhoDashboardTab', () => ({ default: () => <div>ABA-DESEMPENHO</div> }))
vi.mock('@/components/dashboard/CentralDivulgacaoTab', () => ({ default: () => <div>ABA-DIVULGACAO</div> }))
vi.mock('@/components/dashboard/AdCardDashboard', () => ({ AdCardDashboard: () => null }))
vi.mock('@/components/dashboard/ResumoDesempenhoStrip', () => ({ ResumoDesempenhoStrip: () => null }))
vi.mock('@/components/help/HelpCenter', () => ({ ContextualHelp: ({ context }: { context: string }) => <div data-testid="ajuda">{context}</div> }))

import PerfilPage from '@/app/(dashboard)/dashboard/page'

afterEach(() => { cleanup(); busca = ''; status = { cadastroCompleto: true, validando: false, slug: 'ana', prestadorId: 7, bloqueado: false, motivoBloqueio: null } })

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

describe('Painel do prestador — links para o próprio /dashboard', () => {
  it('banner "Adicionar trabalho" (?novo=1) leva para Meus Trabalhos mesmo estando em outra aba', () => {
    const { rerender } = render(<PerfilPage />)
    fireEvent.click(screen.getByRole('button', { name: /Divulgação/ }))
    expect(screen.getByText('ABA-DIVULGACAO')).toBeTruthy()

    busca = 'novo=1'
    rerender(<PerfilPage />)

    return vi.waitFor(() => expect(screen.getByText('ABA-TRABALHOS')).toBeTruthy())
  })

  it('?aba=desempenho aberto de dentro do painel troca a aba', async () => {
    const { rerender } = render(<PerfilPage />)
    expect(screen.getByText('ABA-TRABALHOS')).toBeTruthy()

    busca = 'aba=desempenho'
    rerender(<PerfilPage />)

    await vi.waitFor(() => expect(screen.getByText('ABA-DESEMPENHO')).toBeTruthy())
  })

  it('trocar de aba com o dedo não é desfeito pela URL', async () => {
    busca = 'aba=perfil'
    render(<PerfilPage />)
    await vi.waitFor(() => expect(screen.getByText('ABA-PERFIL')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /Divulgação/ }))
    expect(screen.getByText('ABA-DIVULGACAO')).toBeTruthy()
  })
})

describe('Painel do prestador — aba Divulgação com perfil bloqueado', () => {
  it('mostra o motivo real do bloqueio, não "Complete o perfil", quando o cadastro já está completo', () => {
    status = { ...status, bloqueado: true, motivoBloqueio: 'teste' }
    render(<PerfilPage />)
    const botao = screen.getByRole('button', { name: /Divulgação/ }) as HTMLButtonElement
    expect(botao.disabled).toBe(true)
    expect(botao.textContent).toContain('Perfil bloqueado')
    expect(botao.textContent).not.toContain('Complete o perfil')
  })

  it('continua mostrando "Complete o perfil" quando o cadastro está incompleto', () => {
    status = { ...status, cadastroCompleto: false }
    render(<PerfilPage />)
    const botao = screen.getByRole('button', { name: /Divulgação/ }) as HTMLButtonElement
    expect(botao.disabled).toBe(true)
    expect(botao.textContent).toContain('Complete o perfil')
  })
})
