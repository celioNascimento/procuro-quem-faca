import { describe, expect, it } from 'vitest'
import { deveSairDoCadastro } from '@/lib/auth/cadastroRota'

describe('deveSairDoCadastro', () => {
  it('prestador com perfil ativo que abre /cadastro vai para o painel', () => {
    expect(deveSairDoCadastro({ intendedRole: 'prestador', isPendente: false, ehReivindicacao: false })).toBe(true)
  })

  it('o link de reivindicação NÃO é desviado: a página explica o que fazer', () => {
    expect(deveSairDoCadastro({ intendedRole: 'prestador', isPendente: false, ehReivindicacao: true })).toBe(false)
  })

  it('cadastro pendente continua no formulário', () => {
    expect(deveSairDoCadastro({ intendedRole: 'prestador', isPendente: true, ehReivindicacao: false })).toBe(false)
  })

  it('cliente não é desviado', () => {
    expect(deveSairDoCadastro({ intendedRole: 'cliente', isPendente: true, ehReivindicacao: false })).toBe(false)
  })
})
