// lib/cnpj/motivoFila.test.ts
import { describe, expect, it } from 'vitest'
import { podeAprovar, textoMotivoFila } from './motivoFila'

describe('textoMotivoFila', () => {
  it('explica o nome que não confere', () => {
    expect(textoMotivoFila('nome_nao_confere')).toMatch(/não é igual à razão social/)
  })
  it('explica a situação não ativa', () => {
    expect(textoMotivoFila('situacao_nao_ativa')).toMatch(/não mostra este CNPJ como ativo/)
  })
  it('usa um texto neutro para motivo desconhecido ou vazio', () => {
    expect(textoMotivoFila(null)).toBe('Enviado para conferência.')
    expect(textoMotivoFila('outro')).toBe('Enviado para conferência.')
  })
})

describe('podeAprovar', () => {
  it('só aceita situação ATIVA', () => {
    expect(podeAprovar('ATIVA')).toBe(true)
    expect(podeAprovar('BAIXADA')).toBe(false)
    expect(podeAprovar(null)).toBe(false)
  })
})
