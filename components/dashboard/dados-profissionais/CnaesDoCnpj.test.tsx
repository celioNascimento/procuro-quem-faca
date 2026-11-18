import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CnaesDoCnpj } from './CnaesDoCnpj'

afterEach(cleanup)

const cnpj = {
  cnpj: '29867943000106', razao_social: 'X', consultado_em: '2026-11-17T12:00:00Z', situacao: 'ATIVA',
  cnae_codigo: '4322302', cnae_descricao: 'Instalação de ar condicionado',
  cnaes_secundarios: ['4520007'], cnaes_detalhe: [{ codigo: '4520007', descricao: 'Acessórios para veículos' }],
}

describe('CnaesDoCnpj', () => {
  it('começa fechada e abre e fecha pela seta', () => {
    render(<CnaesDoCnpj cnpj={cnpj} compativeis={['4520007']} />)
    const botao = screen.getByTestId('cnaes-alternar')
    expect(botao.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByTestId('cnaes-lista')).toBeNull()
    fireEvent.click(botao)
    expect(botao.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('cnae-4322302').textContent).toContain('Principal')
    expect(screen.getByTestId('cnae-4520007').textContent).toContain('Combina com o seu perfil')
    expect(screen.getByTestId('cnae-4520007').textContent).toContain('4520-0/07')
    fireEvent.click(botao)
    expect(screen.queryByTestId('cnaes-lista')).toBeNull()
  })
  it('resumo no título conta as atividades e quantas combinam', () => {
    render(<CnaesDoCnpj cnpj={cnpj} compativeis={['4520007']} />)
    expect(screen.getByTestId('cnaes-alternar').textContent).toContain('(2)')
    expect(screen.getByTestId('cnaes-alternar').textContent).toContain('1 combina')
  })
  it('sem CNPJ ou sem atividades: não mostra nada', () => {
    const { container } = render(<CnaesDoCnpj cnpj={null} compativeis={[]} />)
    expect(container.innerHTML).toBe('')
  })
})
