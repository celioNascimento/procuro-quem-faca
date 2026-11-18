import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/components/dashboard/EditarPerfilTab', () => ({ default: () => <div>FORM-PERFIL</div> }))
vi.mock('./AbaCnpj', () => ({ AbaCnpj: () => <div>ABA-CNPJ</div> }))
vi.mock('./BarraEvolucao', () => ({ BarraEvolucao: () => null }))
vi.mock('@/hooks/useSeloCnpj', () => ({ useSeloCnpj: () => ({ fase: 'sem', dados: { verificacao: null, cnpj: null }, cnaesCompativeis: [] }) }))
vi.mock('@/hooks/useExtrasEvolucao', () => ({ useExtrasEvolucao: () => null }))
vi.mock('@/components/help/HelpCenter', () => ({
  ContextualHelp: ({ context, title }: { context: string; title: string }) => <div data-testid="ajuda" data-titulo={title}>{context}</div>,
}))

import DadosProfissionaisTabs from './DadosProfissionaisTabs'

afterEach(cleanup)

describe('Dados Profissionais: a ajuda acompanha a sub-aba', () => {
  it('Meu perfil mostra a ajuda do perfil; CNPJ mostra só a de CNPJ e selos', () => {
    render(<DadosProfissionaisTabs prestadorId={7} />)
    expect(screen.getAllByTestId('ajuda')).toHaveLength(1)
    expect(screen.getByTestId('ajuda').textContent).toBe('painel-dados-perfil')

    fireEvent.click(screen.getByRole('tab', { name: /CNPJ/ }))
    expect(screen.getAllByTestId('ajuda')).toHaveLength(1)
    expect(screen.getByTestId('ajuda').textContent).toBe('painel-dados-cnpj')
    expect(screen.getByTestId('ajuda').getAttribute('data-titulo')).toContain('CNPJ')
  })
})
