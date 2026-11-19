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

describe('ProjetoCard — Mostrar no feed', () => {
  const elegivel = { ...projeto('finalizado'), feed_aceito_em: '2026-11-19T10:00:00Z', feed_oculto: false, feed_revogado_em: null } as Projeto

  it('trabalho concluído e aceito mostra o interruptor, e ele não fica dentro do botão de editar', () => {
    render(<ProjetoCard projeto={elegivel} onClick={() => {}} onAlternarFeed={() => {}} />)
    const sw = screen.getByRole('switch', { name: /Mostrar no feed/i })
    expect(sw.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('button', { name: /Editar projeto/ }).contains(sw)).toBe(false)
  })
  it('não mostra se o cliente retirou, se não foi aceito no feed ou se não está concluído', () => {
    const { rerender } = render(<ProjetoCard projeto={{ ...elegivel, feed_revogado_em: '2026-11-20T10:00:00Z' } as Projeto} onClick={() => {}} onAlternarFeed={() => {}} />)
    expect(screen.queryByRole('switch')).toBeNull()
    rerender(<ProjetoCard projeto={{ ...elegivel, feed_aceito_em: null } as Projeto} onClick={() => {}} onAlternarFeed={() => {}} />)
    expect(screen.queryByRole('switch')).toBeNull()
    rerender(<ProjetoCard projeto={{ ...elegivel, status: 'em_execucao' } as Projeto} onClick={() => {}} onAlternarFeed={() => {}} />)
    expect(screen.queryByRole('switch')).toBeNull()
  })
  it('sem onAlternarFeed o card continua igual (sem interruptor)', () => {
    render(<ProjetoCard projeto={elegivel} onClick={() => {}} />)
    expect(screen.queryByRole('switch')).toBeNull()
  })
})
