// lib/cnpj/nomes.test.ts
import { describe, expect, it } from 'vitest'
import { normalizarNome, removerCpfDoNomeMei } from './nomes'

describe('normalizarNome', () => {
  it('ignora acento, caixa, pontuação e espaços extras', () => {
    expect(normalizarNome('  José  da  Conceição ')).toBe('JOSE DA CONCEICAO')
    expect(normalizarNome('Ana-Maria S.A.')).toBe('ANA MARIA S A')
  })
})

describe('removerCpfDoNomeMei', () => {
  it('remove CPF completo no fim do nome', () => {
    expect(removerCpfDoNomeMei('JOAO DA SILVA 12345678901')).toBe('JOAO DA SILVA')
  })

  it('remove CPF mascarado no fim do nome', () => {
    expect(removerCpfDoNomeMei('MARIA SOUZA ***123456**')).toBe('MARIA SOUZA')
  })

  it('remove os 8 dígitos-base do CNPJ no início do nome (formato real do MEI)', () => {
    expect(removerCpfDoNomeMei('47.403.170 JORGE PAULO DE LIMA')).toBe('JORGE PAULO DE LIMA')
    expect(removerCpfDoNomeMei('47403170 JORGE PAULO DE LIMA')).toBe('JORGE PAULO DE LIMA')
  })

  it('remove os dois números quando aparecem juntos', () => {
    expect(removerCpfDoNomeMei('47.403.170 JORGE PAULO DE LIMA 12345678901')).toBe('JORGE PAULO DE LIMA')
  })

  it('mantém nomes que não terminam em CPF', () => {
    expect(removerCpfDoNomeMei('LOJA 2')).toBe('LOJA 2')
    expect(removerCpfDoNomeMei('PEDRO PEDREIRO')).toBe('PEDRO PEDREIRO')
  })
})
