import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/components/dashboard/VisitasPerfilCard', () => ({
  VisitasPerfilCard: () => <div data-testid="card-visitas" />,
}))
vi.mock('@/components/dashboard/CliquesWhatsappCard', () => ({
  CliquesWhatsappCard: () => <div data-testid="card-cliques" />,
}))
vi.mock('@/components/dashboard/AvaliacoesDashboardTab', () => ({
  default: () => <div data-testid="avaliacoes" />,
}))

import DesempenhoDashboardTab from '@/components/dashboard/DesempenhoDashboardTab'

afterEach(cleanup)

describe('DesempenhoDashboardTab', () => {
  it('abre em Análises por padrão, com visitas e orçamentos', () => {
    render(<DesempenhoDashboardTab prestadorId={1} />)

    expect(screen.getByRole('tab', { name: /análises/i }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('card-visitas')).toBeTruthy()
    expect(screen.getByTestId('card-cliques')).toBeTruthy()
    expect(screen.queryByTestId('avaliacoes')).toBeNull()
  })

  it('alterna para Avaliações e volta', () => {
    render(<DesempenhoDashboardTab prestadorId={1} />)

    fireEvent.click(screen.getByRole('tab', { name: /avaliações/i }))
    expect(screen.getByTestId('avaliacoes')).toBeTruthy()
    expect(screen.queryByTestId('card-visitas')).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: /análises/i }))
    expect(screen.getByTestId('card-visitas')).toBeTruthy()
  })

  it('respeita a sub-aba inicial (links antigos para Avaliações)', () => {
    render(<DesempenhoDashboardTab prestadorId={1} subAbaInicial="avaliacoes" />)

    expect(screen.getByRole('tab', { name: /avaliações/i }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('avaliacoes')).toBeTruthy()
  })

  it('setas do teclado alternam entre as sub-abas', () => {
    render(<DesempenhoDashboardTab prestadorId={1} />)

    fireEvent.keyDown(screen.getByRole('tab', { name: /análises/i }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: /avaliações/i }).getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(screen.getByRole('tab', { name: /avaliações/i }), { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: /análises/i }).getAttribute('aria-selected')).toBe('true')
  })
})
