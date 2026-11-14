import { describe, expect, it } from 'vitest'
import { planoDeGravacaoDaAutorizacao } from '@/lib/trabalho/autorizacaoFoto'

describe('planoDeGravacaoDaAutorizacao', () => {
  it('marcou o rosto e ainda não autorizou: não grava (o banco recusaria)', () => {
    expect(planoDeGravacaoDaAutorizacao({ contemPessoas: true, autorizado: false }, false)).toEqual({ gravar: false })
  })
  it('rosto + autorização: grava os dois', () => {
    expect(planoDeGravacaoDaAutorizacao({ contemPessoas: true, autorizado: true }, false)).toEqual({ gravar: true, contemPessoas: true, autorizado: true })
  })
  it('desmarcou o rosto: grava "sem pessoa"', () => {
    expect(planoDeGravacaoDaAutorizacao({ contemPessoas: false, autorizado: false }, true)).toEqual({ gravar: true, contemPessoas: false, autorizado: false })
  })
  it('retirou a autorização que estava salva: limpa o registro', () => {
    expect(planoDeGravacaoDaAutorizacao({ contemPessoas: true, autorizado: false }, true)).toEqual({ gravar: true, contemPessoas: false, autorizado: false })
  })
})
