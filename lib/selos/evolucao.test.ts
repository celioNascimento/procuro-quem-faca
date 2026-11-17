// lib/selos/evolucao.test.ts
import { describe, expect, it } from 'vitest'
import { montarConquistas, resumoEvolucao } from './evolucao'

describe('montarConquistas', () => {
  it('só o CNPJ está disponível hoje; o resto é "em breve"', () => {
    const c = montarConquistas('sem')
    expect(c.find((x) => x.id === 'cnpj')?.estado).toBe('disponivel')
    expect(c.filter((x) => x.estado === 'em_breve').map((x) => x.id)).toEqual(['experiencia', 'tempo_cnpj', 'atividade'])
  })
  it('mapeia a fase do CNPJ para o estado da conquista', () => {
    expect(montarConquistas('aprovado')[0].estado).toBe('conquistado')
    expect(montarConquistas('em_conferencia')[0].estado).toBe('em_andamento')
    expect(montarConquistas('rejeitado')[0].estado).toBe('disponivel')
    expect(montarConquistas('expirado')[0].estado).toBe('disponivel')
  })
})

describe('resumoEvolucao', () => {
  it('"em breve" não conta no total', () => {
    expect(resumoEvolucao(montarConquistas('sem'))).toEqual({ conquistados: 0, total: 1, percentual: 0, texto: '0 de 1 selo conquistado' })
    expect(resumoEvolucao(montarConquistas('aprovado'))).toEqual({ conquistados: 1, total: 1, percentual: 100, texto: '1 de 1 selo conquistado' })
  })
  it('em conferência ainda não é conquista', () => {
    expect(resumoEvolucao(montarConquistas('em_conferencia')).conquistados).toBe(0)
  })
  it('usa plural com mais de um selo e nunca divide por zero', () => {
    const dois = [
      { id: 'a', titulo: 'A', estado: 'conquistado' as const },
      { id: 'b', titulo: 'B', estado: 'disponivel' as const },
    ]
    expect(resumoEvolucao(dois).texto).toBe('1 de 2 selos conquistados')
    expect(resumoEvolucao(dois).percentual).toBe(50)
    expect(resumoEvolucao([]).percentual).toBe(0)
  })
})
