import { describe, expect, it } from 'vitest'
import { leituraDoFunil, montarFunil, type PerfilDoFunil } from './funil'

const p = (id: number, extra: Partial<PerfilDoFunil> = {}): PerfilDoFunil => ({
  id, user_id: null, exemplo: false, ativacao_status: 'nao_enviado', ativacao_enviado_em: null, ativacao_respondeu_em: null, ...extra,
})

describe('funil de ativação', () => {
  it('conta cada etapa entre os convidados e ignora perfis de exemplo', () => {
    const perfis = [
      p(1), // nunca convidado
      p(2, { ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-20T12:00:00Z' }),
      p(3, { ativacao_status: 'respondeu_positivo', ativacao_enviado_em: '2026-11-19T12:00:00Z', ativacao_respondeu_em: '2026-11-19T13:00:00Z' }),
      p(4, { ativacao_status: 'perfil_completo', ativacao_enviado_em: '2026-11-18T12:00:00Z', user_id: 'u4' }),
      p(5, { ativacao_status: 'avaliacao_recebida', ativacao_enviado_em: '2026-11-17T12:00:00Z', user_id: 'u5' }),
      p(6, { ativacao_status: 'respondeu_negativo', ativacao_enviado_em: '2026-11-17T12:00:00Z' }),
      p(7, { ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-17T12:00:00Z', user_id: 'u7', exemplo: true }),
    ]
    const f = montarFunil(perfis, { 4: { publicou: true, noFeed: false }, 5: { publicou: true, noFeed: true } })
    const total = Object.fromEntries(f.etapas.map((e) => [e.chave, e.total]))
    expect(total).toEqual({ convidados: 5, responderam: 3, conta: 2, publicaram: 2, feed: 1 })
    expect(f.etapas[0].percentual).toBe(100)
    expect(f.etapas[4].percentual).toBe(20)
    expect(f.recusaram).toBe(1)
  })

  it('conta separadamente quem chegou com conta sem convite', () => {
    const f = montarFunil([p(1, { user_id: 'u1' }), p(2, { user_id: 'u2', exemplo: true }), p(3)], {})
    expect(f.contasSemConvite).toBe(1)
    expect(f.etapas[0].total).toBe(0)
    expect(f.etapas.every((e) => e.percentual === 0)).toBe(true)
  })

  it('quem recusou não entra em "responderam com interesse", mesmo com data de resposta', () => {
    const f = montarFunil([p(1, { ativacao_status: 'respondeu_negativo', ativacao_enviado_em: '2026-11-20T12:00:00Z', ativacao_respondeu_em: '2026-11-20T13:00:00Z' })], {})
    expect(f.etapas[1].total).toBe(0)
  })

  it('diz em uma frase onde está o gargalo', () => {
    expect(leituraDoFunil(montarFunil([], {}))).toMatch(/Ninguém foi convidado/)
    const enviado = p(1, { ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-20T12:00:00Z' })
    expect(leituraDoFunil(montarFunil([enviado], {}))).toMatch(/Ninguém respondeu/)
    const comConta = p(2, { ativacao_status: 'respondeu_positivo', ativacao_enviado_em: '2026-11-20T12:00:00Z', user_id: 'u' })
    expect(leituraDoFunil(montarFunil([comConta], {}))).toMatch(/nenhuma com trabalho/)
    expect(leituraDoFunil(montarFunil([comConta], { 2: { publicou: true, noFeed: false } }))).toMatch(/nenhum aceito/)
    expect(leituraDoFunil(montarFunil([comConta], { 2: { publicou: true, noFeed: true } }))).toMatch(/chegou ao feed/)
  })
})
