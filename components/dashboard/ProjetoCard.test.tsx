import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ProjetoCard } from '@/components/dashboard/ProjetoCard'
import type { Projeto } from '@/hooks/usePortfolioDashboard'

afterEach(cleanup)

const projeto = (status: string) =>
  ({
    id: 'p1', titulo: 'Bolo de aniversário', status, sem_fotos: false, avaliacoes: [], solicitacoes_garantia: [],
    portfolio_fotos: [{ id: 'f1', url_foto: 'https://x.com/1.png', ordem: 1 }],
  }) as unknown as Projeto

describe('ProjetoCard — quem vê as fotos', () => {
  it('aceite pendente: diz que a foto só entra no perfil depois do aceite', () => {
    render(<ProjetoCard projeto={projeto('pendente')} onClick={() => {}} />)
    expect(screen.getByText(/1 foto · aparece no perfil depois do aceite/i)).toBeTruthy()
  })

  it('trabalho aceito: diz que já aparece no perfil', () => {
    render(<ProjetoCard projeto={projeto('em_execucao')} onClick={() => {}} />)
    expect(screen.getByText(/1 foto · aparece no seu perfil/i)).toBeTruthy()
  })
})
