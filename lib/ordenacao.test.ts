// lib/ordenacao.test.ts
import { describe, it, expect } from 'vitest'
import { pesoOrdenacao } from '@/lib/ordenacao'

const p = (origem_tipo: string, verificado = false, media_nota = 0) => ({ origem_tipo, verificado, media_nota })

describe('pesoOrdenacao', () => {
  it('vitrine vem antes de tudo', () => {
    expect(pesoOrdenacao(p('vitrine'))).toBeLessThan(pesoOrdenacao(p('registro_direto', true, 5)))
  })

  it('cadastro direto e perfil assumido têm o mesmo tratamento', () => {
    expect(pesoOrdenacao(p('registro_direto'))).toBe(pesoOrdenacao(p('reivindicado')))
    expect(pesoOrdenacao(p('registro_direto', true, 4))).toBe(pesoOrdenacao(p('reivindicado', true, 4)))
  })

  it('verificado sobe uma faixa, inclusive no cadastro direto', () => {
    expect(pesoOrdenacao(p('registro_direto', true))).toBeLessThan(pesoOrdenacao(p('registro_direto', false, 5)))
  })

  it('nota melhor vem antes dentro da mesma faixa', () => {
    expect(pesoOrdenacao(p('registro_direto', false, 5))).toBeLessThan(pesoOrdenacao(p('registro_direto', false, 3)))
  })

  it('perfil real, mesmo sem verificação e sem nota, vem antes da curadoria pública', () => {
    expect(pesoOrdenacao(p('registro_direto'))).toBeLessThan(pesoOrdenacao(p('curadoria_publica', true, 5)))
  })

  it('o nome antigo "proprio" continua valendo', () => {
    expect(pesoOrdenacao(p('proprio', true))).toBeLessThan(1)
  })
})
