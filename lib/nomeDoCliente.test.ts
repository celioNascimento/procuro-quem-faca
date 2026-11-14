// lib/nomeDoCliente.test.ts
import { describe, expect, it } from 'vitest'
import { CLIENTE_SEM_NOME, nomePublicoDoCliente, primeiroNomeDoCliente } from '@/lib/nomeDoCliente'

describe('primeiroNomeDoCliente', () => {
  it('devolve só o primeiro nome, sem sobrenome', () => {
    expect(primeiroNomeDoCliente('  Maria da Silva Souza ')).toBe('Maria')
  })

  it('sem nome, ou com o "Cliente" que o cadastro grava quando o prestador não informa, devolve null', () => {
    expect(primeiroNomeDoCliente(null)).toBeNull()
    expect(primeiroNomeDoCliente('   ')).toBeNull()
    expect(primeiroNomeDoCliente('Cliente')).toBeNull()
    expect(primeiroNomeDoCliente('cliente')).toBeNull()
  })
})

describe('nomePublicoDoCliente', () => {
  it('usa o primeiro nome ou "Cliente deste serviço", nunca "verificado"', () => {
    expect(nomePublicoDoCliente('Maria da Silva')).toBe('Maria')
    expect(nomePublicoDoCliente(undefined)).toBe(CLIENTE_SEM_NOME)
    expect(CLIENTE_SEM_NOME).not.toMatch(/verificad/i)
  })
})
