import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AbaCnpj } from './AbaCnpj'
import type { SeloCnpj } from '@/hooks/useSeloCnpj'

const base: SeloCnpj = {
  dados: { verificacao: null, cnpj: null }, fase: 'sem', carregando: false, enviando: false, removendo: false,
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
