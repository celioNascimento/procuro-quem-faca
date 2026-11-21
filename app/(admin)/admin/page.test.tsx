import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const estado = vi.hoisted(() => ({
  pendencias: null as Record<string, number> | null,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
}))
vi.mock('@/hooks/useAdminDashboard', () => ({
  useAdminDashboard: () => ({
    stats: { cidades: 0, anuncios: 0, prestadores: 0, logs: 0, curadoria: 0, registrados: 0, reivindicados: 0, ativacao: { total: 10, enviados: 10, ativos: 1 } },
    metas: { contas: 4, trabalhosNoFeed: 1 }, radar: [], novosCadastros: [], refreshing: false, notificacao: null, erro: null, pctAtivacao: 40, carregarDashboard: vi.fn(),
  }),
}))
vi.mock('@/hooks/admin/useAdminPendencias', () => ({ useAdminPendencias: () => estado.pendencias }))
vi.mock('@/hooks/useAdminTrafego', () => ({ useAdminTrafego: () => ({}) }))
vi.mock('@/components/admin/TrafegoCard', () => ({ TrafegoCard: () => null }))

import AdminDashboard from '@/app/(admin)/admin/page'

const zeros = { titular_abertas: 0, titular_atrasadas: 0, denuncias_abertas: 0, selos_cnpj_abertos: 0, selos_documentos_abertos: 0 }

describe('Visão geral do admin', () => {
  afterEach(() => {
    cleanup()
    estado.pendencias = null
  })

  it('não mostra mais "Categorias mais buscadas" (o log que a alimentava nunca existiu)', () => {
    render(<AdminDashboard />)
    expect(screen.queryByText('Categorias mais buscadas')).toBeNull()
    expect(screen.getByText('Campanha de ativação')).toBeTruthy()
  })

  it('"Precisa de atenção" lista selos, denúncias e pedidos do titular, sem garantias nem contestações', () => {
    estado.pendencias = { ...zeros, titular_abertas: 1, denuncias_abertas: 2, selos_cnpj_abertos: 3, selos_documentos_abertos: 4 }
    render(<AdminDashboard />)
    expect(screen.getByText('Denúncias abertas')).toBeTruthy()
    expect(screen.getByText('Pedidos do titular em aberto')).toBeTruthy()
    expect(screen.queryByText(/Pedidos LGPD/)).toBeNull()
    expect(screen.getByText('Selos de CNPJ aguardando decisão')).toBeTruthy()
    expect(screen.getByText('Seguro e CND aguardando decisão')).toBeTruthy()
    expect(screen.queryByText(/Garantias abertas|Contestações abertas/)).toBeNull()
  })

  it('sem pendências, mostra "Nada pendente"', () => {
    estado.pendencias = zeros
    render(<AdminDashboard />)
    expect(screen.getByText('Nada pendente')).toBeTruthy()
  })

  it('não mostra mais o card de Anúncios (sem anunciante nem receita)', () => {
    render(<AdminDashboard />)
    expect(screen.queryByText('Anúncios')).toBeNull()
    expect(screen.getByText('Curadoria')).toBeTruthy()
  })

  it('mostra as Metas do mês com o progresso do plano de 30 dias', () => {
    render(<AdminDashboard />)
    expect(screen.getByText('Metas do mês')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Profissionais com conta' }).getAttribute('aria-valuenow')).toBe('4')
    expect(screen.getByRole('progressbar', { name: 'Trabalhos aceitos no feed' }).getAttribute('aria-valuemax')).toBe('3')
    expect(screen.getByRole('progressbar', { name: 'Profissionais com conta' }).getAttribute('aria-valuemax')).toBe('10')
  })
})
