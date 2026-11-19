import { describe, expect, it } from 'vitest'
import { mensagemCnpjNaoAtivo, rotuloSituacao } from './situacao'

describe('situação do CNPJ', () => {
  it('traduz as situações conhecidas', () => {
    expect(rotuloSituacao('BAIXADA')).toBe('baixada')
    expect(rotuloSituacao(' suspensa ')).toBe('suspensa')
  })
  it('lida com situação vazia ou desconhecida', () => {
    expect(rotuloSituacao('')).toBe('sem situação ativa')
    expect(rotuloSituacao(null)).toBe('sem situação ativa')
    expect(rotuloSituacao('EM ANALISE')).toBe('em analise')
  })
  it('a mensagem pede para regularizar e tentar de novo', () => {
    expect(mensagemCnpjNaoAtivo('INAPTA')).toBe('A Receita Federal mostra este CNPJ como inapta. Regularize a situação do CNPJ e tente novamente.')
  })
})
