import { describe, expect, it } from 'vitest'
import { contatoEhValido, validarPedidoTitular } from '@/lib/titular/pedido'

const base = { tipo: 'exclusao', nome: 'Maria', contato: 'maria@exemplo.com', descricao: '' }

describe('contatoEhValido', () => {
  it.each(['maria@exemplo.com', '(43) 99999-9999', '43999999999', '+55 43 99999-9999'])('aceita %s', (c) => {
    expect(contatoEhValido(c)).toBe(true)
  })
  it.each(['', 'abc', 'maria@', '@exemplo.com', '12345', 'maria exemplo.com', '999'])('recusa "%s"', (c) => {
    expect(contatoEhValido(c)).toBe(false)
  })
})

describe('validarPedidoTitular', () => {
  it('aceita um pedido completo e normaliza os campos', () => {
    const r = validarPedidoTitular({ ...base, nome: '  Maria  ', prestadorId: '12' })
    expect(r).toEqual({
      ok: true, robo: false,
      dados: { tipo: 'exclusao', nome: 'Maria', contato: 'maria@exemplo.com', descricao: null, prestadorId: 12 },
    })
  })

  it('nome e detalhes são opcionais', () => {
    const r = validarPedidoTitular({ tipo: 'acesso', contato: '(43) 99999-9999' })
    expect(r.ok).toBe(true)
  })

  it('recusa tipo fora da lista oferecida no formulário', () => {
    const r = validarPedidoTitular({ ...base, tipo: 'portabilidade' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erros.tipo).toBeDefined()
  })

  it('recusa contato inválido', () => {
    const r = validarPedidoTitular({ ...base, contato: 'oi' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erros.contato).toBeDefined()
  })

  it('"outro pedido" exige uma descrição', () => {
    const r = validarPedidoTitular({ ...base, tipo: 'outro', descricao: 'curto' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erros.descricao).toBeDefined()
    expect(validarPedidoTitular({ ...base, tipo: 'outro', descricao: 'Quero portabilidade dos meus dados' }).ok).toBe(true)
  })

  it('recusa textos acima do limite', () => {
    expect(validarPedidoTitular({ ...base, nome: 'a'.repeat(201) }).ok).toBe(false)
    expect(validarPedidoTitular({ ...base, descricao: 'a'.repeat(2001) }).ok).toBe(false)
  })

  it('marca como robô quando o campo escondido vem preenchido', () => {
    const r = validarPedidoTitular({ ...base, website: 'http://spam.example' })
    expect(r.ok && r.robo).toBe(true)
  })

  it('ignora um id de perfil inválido em vez de quebrar', () => {
    for (const prestadorId of ['abc', -3, 0, 1.5, null, undefined]) {
      const r = validarPedidoTitular({ ...base, prestadorId })
      expect(r.ok && r.dados.prestadorId).toBeNull()
    }
  })

  it('entrada que não é objeto vira erro, não exceção', () => {
    expect(validarPedidoTitular(null).ok).toBe(false)
    expect(validarPedidoTitular('texto').ok).toBe(false)
  })
})
