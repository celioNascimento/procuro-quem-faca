import { describe, expect, it, vi } from 'vitest'
import { convidarAdmin, ErroDeConvite } from './convidarAdmin'

const ORIGEM = 'https://procuroquemfaca.com.br'
const dep = (respostas: string[], envio: () => Promise<void> = async () => {}) => {
  const adicionar = vi.fn(async () => respostas.shift() ?? 'ok')
  const enviarConvite = vi.fn(envio)
  return { adicionar, enviarConvite }
}

describe('convidarAdmin', () => {
  it('e-mail inválido: não chama o banco nem envia nada', async () => {
    const d = dep([])
    expect(await convidarAdmin('abc', ORIGEM, d)).toEqual({ codigo: 'email_invalido', convidado: false })
    expect(d.adicionar).not.toHaveBeenCalled()
    expect(d.enviarConvite).not.toHaveBeenCalled()
  })

  it('quem já tem conta entra direto, sem e-mail de convite', async () => {
    const d = dep(['ok'])
    expect(await convidarAdmin(' Ana@X.com ', ORIGEM, d)).toEqual({ codigo: 'ok', convidado: false })
    expect(d.adicionar).toHaveBeenCalledWith('ana@x.com')
    expect(d.enviarConvite).not.toHaveBeenCalled()
  })

  it.each(['sem_permissao', 'ja_e_admin'])('devolve o código "%s" do banco sem enviar convite', async (codigo) => {
    const d = dep([codigo])
    expect(await convidarAdmin('a@x.com', ORIGEM, d)).toEqual({ codigo, convidado: false })
    expect(d.enviarConvite).not.toHaveBeenCalled()
  })

  it('sem conta: envia o convite para a tela de criar senha e depois adiciona à equipe', async () => {
    const d = dep(['sem_conta', 'ok'])
    expect(await convidarAdmin('nova@x.com', ORIGEM, d)).toEqual({ codigo: 'ok', convidado: true })
    expect(d.enviarConvite).toHaveBeenCalledWith('nova@x.com', `${ORIGEM}/recuperar-senha`)
    expect(d.adicionar).toHaveBeenCalledTimes(2)
  })

  it('falha no envio: não adiciona à equipe e explica em linguagem simples', async () => {
    const d = dep(['sem_conta'], async () => { throw new Error('Email rate limit exceeded') })
    const erro = await convidarAdmin('nova@x.com', ORIGEM, d).catch((e) => e)
    expect(erro).toBeInstanceOf(ErroDeConvite)
    expect(erro.status).toBe(429)
    expect(erro.message).toContain('limite de e-mails')
    expect(d.adicionar).toHaveBeenCalledTimes(1)

    const outro = await convidarAdmin('nova@x.com', ORIGEM, dep(['sem_conta'], async () => { throw new Error('smtp caiu') })).catch((e) => e)
    expect(outro.status).toBe(502)
  })

  it('se o segundo passo ainda falhar, devolve o código sem marcar como convidado', async () => {
    const d = dep(['sem_conta', 'sem_conta'])
    expect(await convidarAdmin('nova@x.com', ORIGEM, d)).toEqual({ codigo: 'sem_conta', convidado: false })
  })
})
