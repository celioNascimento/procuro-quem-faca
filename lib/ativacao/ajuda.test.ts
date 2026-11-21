import { describe, expect, it } from 'vitest'
import { diasDesde, mensagemDeAjuda, montarAjuda, resumoDaAjuda, type PrestadorComConta } from './ajuda'
import type { LinhaDeTrabalho } from './funil'

const AGORA = new Date('2026-11-20T15:00:00Z')
const dias = (n: number) => new Date(AGORA.getTime() - n * 86_400_000).toISOString()

const prest = (id: number, extra: Partial<PrestadorComConta> = {}): PrestadorComConta => ({
  id, nome: `Pessoa ${id}`, whatsapp: '43999990000', cidade: 'Londrina', user_id: `u${id}`, exemplo: false, created_at: dias(1), ...extra,
})
const trab = (id: string, prestador_id: number, extra: Partial<LinhaDeTrabalho> = {}): LinhaDeTrabalho => ({
  id, prestador_id, titulo: 'Pintura', status: 'pendente', created_at: dias(1), aceito_at: null,
  feed_aceito_em: null, feed_revogado_em: null, feed_oculto: false, ...extra,
})

describe('Precisa de ajuda', () => {
  it('conta sem trabalho, trabalho esperando o cliente e trabalho aceito sem finalizar', () => {
    const itens = montarAjuda(
      [prest(1), prest(2), prest(3)],
      [trab('a', 2, { status: 'pendente' }), trab('b', 3, { status: 'em_execucao', aceito_at: dias(5) })],
      AGORA,
    )
    expect(resumoDaAjuda(itens)).toEqual({ sem_trabalho: 1, aguardando_cliente: 1, aguardando_finalizar: 1 })
    expect(itens.find((i) => i.motivo === 'aguardando_finalizar')?.dias).toBe(5)
  })

  it('ignora perfis sem conta, perfis de exemplo e trabalhos já finalizados', () => {
    const itens = montarAjuda(
      [prest(1, { user_id: null }), prest(2, { exemplo: true }), prest(3)],
      [trab('a', 3, { status: 'finalizado' })],
      AGORA,
    )
    expect(itens).toEqual([])
  })

  it('marca como parado a partir de 3 dias e põe os parados primeiro, do mais antigo ao mais novo', () => {
    const itens = montarAjuda([prest(1, { created_at: dias(1) }), prest(2, { created_at: dias(4) }), prest(3, { created_at: dias(9) })], [], AGORA)
    expect(itens.map((i) => [i.prestadorId, i.parado])).toEqual([[3, true], [2, true], [1, false]])
  })

  it('trabalho em execução sem data de aceite usa a data de criação; sem nenhuma data, é descartado', () => {
    const itens = montarAjuda([prest(1)], [trab('a', 1, { status: 'em_execucao', aceito_at: null, created_at: dias(2) })], AGORA)
    expect(itens[0].dias).toBe(2)
    expect(montarAjuda([prest(1)], [trab('b', 1, { status: 'em_execucao', aceito_at: null, created_at: null })], AGORA)).toEqual([])
  })

  it('calcula dias sem passar de zero e sem quebrar com data inválida', () => {
    expect(diasDesde(dias(3), AGORA)).toBe(3)
    expect(diasDesde('2030-01-01T00:00:00Z', AGORA)).toBe(0)
    expect(diasDesde('x', AGORA)).toBe(0)
  })

  it('a mensagem usa o primeiro nome e o título do trabalho, sem prometer nada', () => {
    const [i] = montarAjuda([prest(1, { nome: 'Ana Souza' })], [trab('a', 1)], AGORA)
    const m = mensagemDeAjuda(i)
    expect(m).toContain('Ana')
    expect(m).not.toContain('Souza')
    expect(m).toContain('"Pintura"')
    expect(mensagemDeAjuda({ ...i, motivo: 'sem_trabalho', titulo: null })).toMatch(/primeiro trabalho/)
  })
})
