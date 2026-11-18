// lib/cnpj/decisao.test.ts
import { describe, expect, it } from 'vitest'
import type { DadosCnpj } from './consulta'
import { decidirVerificacao } from './decisao'

const base: DadosCnpj = {
  cnpj: '11222333000181',
  razaoSocial: 'JOAO DA SILVA',
  nomeFantasia: 'JS REPAROS',
  situacao: 'ATIVA',
  porte: null,
  naturezaJuridica: null,
  mei: true,
  cnaeCodigo: '4330404',
  cnaeDescricao: null,
  dataAbertura: '2015-03-10',
  socios: ['MARIA SOUZA'],
  fonte: 'brasilapi',
}

describe('decidirVerificacao', () => {
  it('aprova quando ativa e o nome bate com a razão social, sem importar acento ou caixa', () => {
    expect(decidirVerificacao('joão da silva', base)).toEqual({ status: 'aprovada', motivo: 'automatica' })
  })

  it('aprova pelo nome fantasia', () => {
    expect(decidirVerificacao('JS Reparos', base).status).toBe('aprovada')
  })

  it('aprova pelo nome de um sócio', () => {
    expect(decidirVerificacao('Maria Souza', base).status).toBe('aprovada')
  })

  it('manda para a fila quando o nome não confere', () => {
    expect(decidirVerificacao('Pedro Pedreiro', base)).toEqual({ status: 'pendente', motivo: 'nome_nao_confere' })
  })

  it('manda para a fila quando a situação não é ativa, mesmo com nome certo', () => {
    expect(decidirVerificacao('JOAO DA SILVA', { ...base, situacao: 'BAIXADA' })).toEqual({
      status: 'pendente',
      motivo: 'situacao_nao_ativa',
    })
  })

  it('nome vazio nunca aprova', () => {
    expect(decidirVerificacao('   ', { ...base, razaoSocial: '' }).status).toBe('pendente')
  })

  it('aprova se qualquer um dos nomes bater (nome do perfil ou nome completo da conta)', () => {
    expect(decidirVerificacao(['Zé Eletricista', 'João da Silva'], base).status).toBe('aprovada')
    expect(decidirVerificacao(['Zé Eletricista', ''], base).status).toBe('pendente')
  })
})
