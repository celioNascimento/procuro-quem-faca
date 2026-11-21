import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { FunilDeAtivacao } from './FunilDeAtivacao'
import { montarFunil } from '@/lib/ativacao/funil'

afterEach(cleanup)

const conv = { ativacao_enviado_em: '2026-11-20T12:00:00Z', ativacao_respondeu_em: null }

describe('FunilDeAtivacao', () => {
  it('mostra as cinco etapas com número e percentual e a leitura do gargalo', () => {
    const funil = montarFunil([
      { id: 1, ativacao_status: 'enviado', ...conv },
      { id: 2, ativacao_status: 'respondeu_positivo', user_id: 'u2', ...conv },
    ], { 2: { publicou: true, noFeed: false } })
    render(<FunilDeAtivacao funil={funil} />)
    expect(screen.getByTestId('funil-convidados').textContent).toContain('2')
    expect(screen.getByTestId('funil-responderam').textContent).toContain('50%')
    expect(screen.getByTestId('funil-publicaram').textContent).toContain('1 · 50%')
    expect(screen.getByTestId('funil-feed').textContent).toContain('0 · 0%')
    expect(screen.getByTestId('funil-leitura').textContent).toMatch(/nenhum aceito/)
  })

  it('sem convites, orienta a começar pela fila do dia', () => {
    render(<FunilDeAtivacao funil={montarFunil([], {})} />)
    expect(screen.getByTestId('funil-leitura').textContent).toMatch(/Para fazer hoje/)
  })

  it('avisa quantos recusaram e quantas contas chegaram sem convite', () => {
    const funil = montarFunil([
      { id: 1, ativacao_status: 'respondeu_negativo', ...conv },
      { id: 2, ativacao_status: 'nao_enviado', user_id: 'u2', ativacao_enviado_em: null, ativacao_respondeu_em: null },
    ], {})
    render(<FunilDeAtivacao funil={funil} />)
    expect(screen.getByText(/1 recusaram/)).toBeTruthy()
    expect(screen.getByText(/1 contas reais chegaram sem passar por um convite/)).toBeTruthy()
  })
})
