import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { BarraEvolucao } from './BarraEvolucao'
import { montarConquistas } from '@/lib/selos/evolucao'

afterEach(cleanup)

describe('BarraEvolucao com os selos calculados', () => {
  it('mostra o andamento da experiência e o que depende do CNPJ', () => {
    render(<BarraEvolucao conquistas={montarConquistas('sem', {
      experiencia: { servicos: 5, clientes: 4, atingido: false }, tempoCnpj: null, atividadeCompativel: false,
    })} />)
    expect(screen.getByText('4 de 10 clientes diferentes avaliaram seus serviços')).toBeTruthy()
    expect(screen.getByTestId('conquista-experiencia').textContent).toContain('Em andamento')
    expect(screen.getByTestId('conquista-tempo_cnpj').textContent).toContain('Depende do CNPJ')
    expect(screen.getByTestId('evolucao-texto').textContent).toBe('0 de 4 selos conquistados')
  })

  it('selos conquistados contam na barra; "não se aplica" não pune', () => {
    render(<BarraEvolucao conquistas={montarConquistas('aprovado', {
      experiencia: { servicos: 10, clientes: 10, atingido: true }, tempoCnpj: 5, atividadeCompativel: false,
    })} />)
    expect(screen.getByTestId('conquista-atividade').textContent).toContain('Não se aplica')
    expect(screen.getByTestId('evolucao-texto').textContent).toBe('3 de 3 selos conquistados')
  })
})

describe('BarraEvolucao: categoria que ainda não sabemos conferir', () => {
  it('mostra "Ainda não sabemos" e o convite para nos ajudar pelo WhatsApp', () => {
    render(<BarraEvolucao conquistas={montarConquistas('aprovado', {
      experiencia: { servicos: 0, clientes: 0, atingido: false }, tempoCnpj: null, atividadeCompativel: false, categoriaSemMapeamento: true,
    })} />)
    const item = screen.getByTestId('conquista-atividade')
    expect(item.textContent).toContain('Ainda não sabemos')
    const link = screen.getByTestId('acao-atividade') as HTMLAnchorElement
    expect(link.textContent).toContain('Contar qual CNAE eu uso')
    expect(link.href).toMatch(/^https:\/\/wa\.me\//)
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
  })

  it('sem esse caso, não aparece convite nenhum', () => {
    render(<BarraEvolucao conquistas={montarConquistas('aprovado', {
      experiencia: { servicos: 0, clientes: 0, atingido: false }, tempoCnpj: null, atividadeCompativel: true,
    })} />)
    expect(screen.queryByTestId('acao-atividade')).toBeNull()
  })
})
