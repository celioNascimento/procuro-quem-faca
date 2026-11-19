// lib/ordenacao.test.ts
import { describe, it, expect } from 'vitest'
import { pesoOrdenacao } from '@/lib/ordenacao'

const p = (origem_tipo: string, media_nota = 0) => ({ origem_tipo, media_nota })

describe('pesoOrdenacao', () => {
  it('vitrine vem antes de tudo', () => {
    expect(pesoOrdenacao(p('vitrine'))).toBeLessThan(pesoOrdenacao(p('registro_direto', 5)))
  })

  it('cadastro direto e perfil assumido têm o mesmo tratamento', () => {
    expect(pesoOrdenacao(p('registro_direto'))).toBe(pesoOrdenacao(p('reivindicado')))
    expect(pesoOrdenacao(p('registro_direto', 4))).toBe(pesoOrdenacao(p('reivindicado', 4)))
  })

  it('selo de confiança não muda a posição: só a nota decide dentro da faixa', () => {
    const comSelo = { origem_tipo: 'registro_direto', media_nota: 0, verificado: true, selo_cnpj: true }
    expect(pesoOrdenacao(comSelo)).toBe(pesoOrdenacao(p('registro_direto')))
    expect(pesoOrdenacao(p('registro_direto', 5))).toBeLessThan(pesoOrdenacao(comSelo))
  })

  it('nota melhor vem antes dentro da mesma faixa', () => {
    expect(pesoOrdenacao(p('registro_direto', 5))).toBeLessThan(pesoOrdenacao(p('registro_direto', 3)))
  })

  it('a média por estrelas desempata com precisão: 4,6 vem antes de 4,5', () => {
    expect(pesoOrdenacao(p('registro_direto', 4.6))).toBeLessThan(pesoOrdenacao(p('registro_direto', 4.5)))
  })

  it('perfil real, mesmo sem verificação e sem nota, vem antes da curadoria pública', () => {
    expect(pesoOrdenacao(p('registro_direto'))).toBeLessThan(pesoOrdenacao(p('curadoria_publica', 5)))
  })

  it('o nome antigo "proprio" continua valendo', () => {
    expect(pesoOrdenacao(p('proprio'))).toBe(pesoOrdenacao(p('registro_direto')))
  })
})
