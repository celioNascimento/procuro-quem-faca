import { describe, expect, it } from 'vitest'
import { montarChamada } from '@/lib/garantia/acoes'

const ID = '5cea4c9b-7acd-4465-a221-5069bd270b98'

describe('montarChamada', () => {
  it('abrir: mapeia para a função do banco e valida o projeto', () => {
    const r = montarChamada({ acao: 'abrir', projetoId: ID, texto: 'descrição' })
    expect(r).toEqual({
      ok: true,
      chamada: { funcao: 'garantia_abrir_caso', args: { p_projeto_id: ID, p_descricao: 'descrição' }, evento: 'aberto' },
    })
    expect(montarChamada({ acao: 'abrir', projetoId: 'nao-uuid', texto: 'x' }).ok).toBe(false)
    expect(montarChamada({ acao: 'abrir', projetoId: ID }).ok).toBe(false)
  })

  it.each([
    ['aceitar', 'garantia_aceitar_oferta', 'aceita'],
    ['recusar', 'garantia_recusar_oferta', 'recusada'],
    ['reabrir', 'garantia_reabrir', 'reaberto'],
  ])('%s usa só o id do caso', (acao, funcao, evento) => {
    const r = montarChamada({ acao, casoId: ID })
    expect(r).toEqual({ ok: true, chamada: { funcao, args: { p_caso_id: ID }, evento } })
    expect(montarChamada({ acao }).ok).toBe(false)
  })

  it('responder e oferecer exigem texto', () => {
    expect(montarChamada({ acao: 'responder', casoId: ID, texto: 'ok' }).ok).toBe(true)
    expect(montarChamada({ acao: 'responder', casoId: ID }).ok).toBe(false)
    expect(montarChamada({ acao: 'oferecer', avaliacaoId: ID, texto: 'refaço' }).ok).toBe(true)
    expect(montarChamada({ acao: 'oferecer', avaliacaoId: 'x', texto: 'refaço' }).ok).toBe(false)
  })

  it('texto acima de 2000 caracteres é recusado', () => {
    expect(montarChamada({ acao: 'responder', casoId: ID, texto: 'a'.repeat(2001) }).ok).toBe(false)
  })

  it('confirmar valida nota (1-5), fotos e usa defaults', () => {
    const ok = montarChamada({ acao: 'confirmar', casoId: ID, texto: 'resolvido', fotos: ['a.jpg'], nota: 5 })
    expect(ok).toMatchObject({ ok: true, chamada: { funcao: 'garantia_confirmar_resolucao', evento: 'resolvido' } })
    const semNota = montarChamada({ acao: 'confirmar', casoId: ID })
    expect(semNota).toMatchObject({ ok: true, chamada: { args: { p_descricao: '', p_fotos: [], p_nova_nota: null } } })
    expect(montarChamada({ acao: 'confirmar', casoId: ID, nota: 6 }).ok).toBe(false)
    expect(montarChamada({ acao: 'confirmar', casoId: ID, nota: 2.5 }).ok).toBe(false)
    expect(montarChamada({ acao: 'confirmar', casoId: ID, fotos: Array(21).fill('a') }).ok).toBe(false)
  })

  it('ação desconhecida ou corpo inválido', () => {
    expect(montarChamada({ acao: 'apagar', casoId: ID }).ok).toBe(false)
    expect(montarChamada(null).ok).toBe(false)
    expect(montarChamada('texto').ok).toBe(false)
  })
})
