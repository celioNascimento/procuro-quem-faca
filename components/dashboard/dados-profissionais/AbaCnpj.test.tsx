import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AbaCnpj } from './AbaCnpj'
import type { SeloCnpj } from '@/hooks/useSeloCnpj'

const base: SeloCnpj = {
  dados: { verificacao: null, cnpj: null }, cnaesCompativeis: [], fase: 'sem', carregando: false, enviando: false, removendo: false,
  digitado: '', erro: null, aviso: null, digitar: vi.fn(), enviar: vi.fn(), remover: vi.fn(),
}
const cnpj = (situacao: string) => ({
  cnpj: '47403170000180', razao_social: 'JORGE PAULO DE LIMA', consultado_em: '2026-11-17T12:00:00Z', situacao,
})

describe('AbaCnpj em conferência', () => {
  it('CNPJ que a Receita não mostra como ativo: explica que o selo foi pausado', () => {
    render(<AbaCnpj temPerfil selo={{ ...base, fase: 'em_conferencia',
      dados: { verificacao: { status: 'pendente', valido_ate: null, verificado_em: null }, cnpj: cnpj('SUSPENSA') } }} />)
    expect(screen.getByText('A Receita não mostra o seu CNPJ como ativo.')).toBeTruthy()
    expect(screen.getByTestId('cnpj-aviso-inativo')).toBeTruthy()
  })

  it('conferência comum (CNPJ ativo, nome a conferir): mantém o texto simples, sem alarme', () => {
    render(<AbaCnpj temPerfil selo={{ ...base, fase: 'em_conferencia',
      dados: { verificacao: { status: 'pendente', valido_ate: null, verificado_em: null }, cnpj: cnpj('ATIVA') } }} />)
    expect(screen.getByText('Seu CNPJ está em conferência.')).toBeTruthy()
    expect(screen.queryByTestId('cnpj-aviso-inativo')).toBeNull()
  })
})

describe('AbaCnpj: motivos para informar o CNPJ', () => {
  it('quem ainda não informou vê os motivos e o link da ajuda, antes do campo', () => {
    render(<AbaCnpj temPerfil selo={{ ...base, fase: 'sem' }} />)
    const bloco = screen.getByTestId('cnpj-motivos')
    expect(bloco.textContent).toContain('Por que informar o CNPJ?')
    expect(bloco.textContent).toContain('nível Bronze')
    expect(bloco.textContent).toContain('Ele não muda a posição na busca')
    const link = bloco.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/ajuda?artigo=selo-cnpj-prestador&publico=prestador')
  })

  it('quem já tem o selo ou está em conferência não vê o bloco de convencimento', () => {
    render(<AbaCnpj temPerfil selo={{ ...base, fase: 'em_conferencia', dados: { verificacao: { status: 'pendente', valido_ate: null, verificado_em: null }, cnpj: cnpj('ATIVA') } }} />)
    expect(screen.queryByTestId('cnpj-motivos')).toBeNull()
  })
})

describe('AbaCnpj: CNPJ que deixou de ser ativo na reverificação', () => {
  it('pede para regularizar e permite informar de novo, sem falar em conferência da equipe', () => {
    render(<AbaCnpj temPerfil selo={{ ...base, fase: 'expirado',
      dados: { verificacao: { status: 'expirada', valido_ate: null, verificado_em: null }, cnpj: cnpj('SUSPENSA') } }} />)
    const aviso = screen.getByTestId('cnpj-fase-inativo')
    expect(aviso.textContent).toContain('Seu selo está pausado')
    expect(aviso.textContent).toContain('suspensa')
    expect(aviso.textContent).toContain('Regularize')
    expect(screen.getByRole('button', { name: 'Conferir meu CNPJ' })).toBeTruthy()
    expect(screen.queryByTestId('cnpj-fase-expirado')).toBeNull()
  })

  it('selo vencido com CNPJ ainda ativo mantém o texto de renovação', () => {
    render(<AbaCnpj temPerfil selo={{ ...base, fase: 'expirado',
      dados: { verificacao: { status: 'expirada', valido_ate: null, verificado_em: null }, cnpj: cnpj('ATIVA') } }} />)
    expect(screen.getByTestId('cnpj-fase-expirado')).toBeTruthy()
    expect(screen.queryByTestId('cnpj-fase-inativo')).toBeNull()
  })
})
