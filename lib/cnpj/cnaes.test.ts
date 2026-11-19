import { describe, expect, it } from 'vitest'
import { formatarCnae, listarCnaes } from './cnaes'

describe('formatarCnae', () => {
  it('formata 7 dígitos no padrão da Receita', () => {
    expect(formatarCnae('4520007')).toBe('4520-0/07')
  })
  it('deixa passar o que não tem 7 dígitos', () => {
    expect(formatarCnae('45200')).toBe('45200')
  })
})

describe('listarCnaes', () => {
  it('principal primeiro, secundárias com descrição, sem repetir e marcando o que combina', () => {
    const itens = listarCnaes(
      {
        cnae_codigo: '4321500', cnae_descricao: 'Instalação elétrica',
        cnaes_secundarios: ['4520007', '4321500'],
        cnaes_detalhe: [{ codigo: '4520007', descricao: 'Acessórios para veículos' }],
      },
      ['4520007'],
    )
    expect(itens.map((i) => i.codigo)).toEqual(['4321500', '4520007'])
    expect(itens[0]).toMatchObject({ principal: true, combina: false, descricao: 'Instalação elétrica' })
    expect(itens[1]).toMatchObject({ principal: false, combina: true, descricao: 'Acessórios para veículos', formatado: '4520-0/07' })
  })
  it('CNPJ antigo, sem secundárias nem descrições: só a principal, sem quebrar', () => {
    expect(listarCnaes({ cnae_codigo: '4520007', cnae_descricao: null }).length).toBe(1)
  })
  it('sem CNPJ: lista vazia', () => {
    expect(listarCnaes(null)).toEqual([])
  })
})
