import { describe, expect, it } from 'vitest'
import { apresentarNivel } from './nivel'

describe('apresentarNivel', () => {
  it('Bronze tem cor própria e diz o que falta para o Prata', () => {
    const n = apresentarNivel('bronze')
    expect(n.nome).toBe('Bronze')
    expect(n.classes).toContain('amber')
    expect(n.proximo).toContain('Prata')
  })
  it('Prata tem cor diferente do Bronze e não tem próximo nível', () => {
    const n = apresentarNivel('prata')
    expect(n.nome).toBe('Prata')
    expect(n.classes).not.toBe(apresentarNivel('bronze').classes)
    expect(n.proximo).toBeNull()
  })
  it('sem nível ou nível desconhecido: orienta a informar o CNPJ', () => {
    expect(apresentarNivel(null).nome).toBe('Sem nível ainda')
    expect(apresentarNivel('xyz').chave).toBeNull()
    expect(apresentarNivel(undefined).proximo).toContain('CNPJ')
  })
})
