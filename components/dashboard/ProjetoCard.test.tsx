import { readFileSync } from 'node:fs'
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

describe('ProjetoCard — sem interruptor do feed', () => {
  it('o interruptor "Mostrar no feed" mora em Divulgação, não no card do trabalho', () => {
    const elegivel = { ...projeto('finalizado'), feed_aceito_em: '2026-11-19T10:00:00Z', feed_oculto: false, feed_revogado_em: null } as Projeto
    render(<ProjetoCard projeto={elegivel} onClick={() => {}} />)
    expect(screen.queryByRole('switch')).toBeNull()
  })
})

// Regressão (19/11): no celular a lista de trabalhos ficou mais larga que a tela (a página rolava para o lado).
// Causa: o card ganhou um <div> em volta (para o interruptor do feed) sem min-w-0, e o título tem `truncate`
// (nowrap): como item de grid, a coluna crescia até caber o título inteiro. jsdom não calcula layout, então
// o teste confere as duas classes que impedem isso.
describe('ProjetoCard — não alarga a coluna da lista no celular', () => {
  it('o card (item da grade) tem min-w-0 e não cresce com o título longo', () => {
    const longo = { ...projeto('em_execucao'), titulo: 'Muro de 10 metros com acabamento especial (em execução)' } as Projeto
    const { container } = render(<ProjetoCard projeto={longo} onClick={() => {}} />)
    expect((container.firstElementChild as HTMLElement).className).toContain('min-w-0')
  })
  it('a grade de trabalhos do painel tem uma coluna de largura fixa (grid-cols-1) abaixo de xl', () => {
    const codigo = readFileSync('components/dashboard/PortfolioDashboardTab.tsx', 'utf8')
    const grades = codigo.match(/className="grid [^"]*xl:grid-cols-2"/g) ?? []
    expect(grades.length).toBeGreaterThan(0)
    for (const g of grades) expect(g).toContain('grid-cols-1')
  })
})
