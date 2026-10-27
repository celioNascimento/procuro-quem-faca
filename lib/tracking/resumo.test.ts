// lib/tracking/resumo.test.ts

import { describe, expect, it } from 'vitest'
import {
  diaLocal,
  diasDoPeriodo,
  inicioDoPeriodo,
  resumirCliques,
  ROTULO_SEM_ORIGEM,
  type CliqueLinha,
} from './resumo'

// 27/10/2026, 19h20 em Brasília (22h20 UTC)
const AGORA = new Date('2026-10-27T22:20:00Z')

function clique(parcial: Partial<CliqueLinha>): CliqueLinha {
  return {
    prestador_id: 1,
    created_at: '2026-10-27T22:00:00Z',
    origem: 'direto',
    campanha: null,
    sessao_id: 'sessao-a',
    ...parcial,
  }
}

describe('diaLocal', () => {
  it('usa o dia de Brasília, não o de UTC', () => {
    // 01h UTC de 28/10 ainda é 22h de 27/10 em Brasília
    expect(diaLocal(new Date('2026-10-28T01:00:00Z'))).toBe('2026-10-27')
    expect(diaLocal(new Date('2026-10-28T03:00:00Z'))).toBe('2026-10-28')
  })
})

describe('diasDoPeriodo / inicioDoPeriodo', () => {
  it('lista os dias do mais antigo ao de hoje', () => {
    expect(diasDoPeriodo(AGORA, 3)).toEqual(['2026-10-25', '2026-10-26', '2026-10-27'])
  })

  it('o período começa à meia-noite de Brasília do primeiro dia', () => {
    expect(inicioDoPeriodo(AGORA, 3)).toBe('2026-10-25T03:00:00.000Z')
  })
})

describe('resumirCliques', () => {
  it('sem cliques: zeros e todos os dias do período presentes', () => {
    const r = resumirCliques([], AGORA, 7)
    expect(r.total).toBe(0)
    expect(r.sessoesUnicas).toBe(0)
    expect(r.porDia).toHaveLength(7)
    expect(r.porDia.every((d) => d.total === 0)).toBe(true)
  })

  it('conta pessoas diferentes por sessão e ignora o marcador backfill', () => {
    const r = resumirCliques(
      [
        clique({ sessao_id: 'a' }),
        clique({ sessao_id: 'a' }),
        clique({ sessao_id: 'b' }),
        clique({ sessao_id: 'backfill' }),
        clique({ sessao_id: null }),
      ],
      AGORA,
      7,
    )
    expect(r.total).toBe(5)
    expect(r.sessoesUnicas).toBe(2)
  })

  it('agrupa por origem e campanha, com rótulo para origem nula', () => {
    const r = resumirCliques(
      [
        clique({ origem: 'meta', campanha: 'palhano' }),
        clique({ origem: 'meta', campanha: 'palhano' }),
        clique({ origem: 'meta', campanha: 'centro' }),
        clique({ origem: null }),
      ],
      AGORA,
      7,
    )
    expect(r.porOrigem[0]).toEqual({ origem: 'meta', campanha: 'palhano', total: 2 })
    expect(r.porOrigem).toHaveLength(3)
    expect(r.porOrigem.some((o) => o.origem === ROTULO_SEM_ORIGEM)).toBe(true)
  })

  it('ranqueia prestadores e conta quantos são diferentes', () => {
    const r = resumirCliques(
      [
        clique({ prestador_id: 128 }),
        clique({ prestador_id: 128 }),
        clique({ prestador_id: 145 }),
        clique({ prestador_id: null }),
      ],
      AGORA,
      7,
    )
    expect(r.porPrestador).toEqual([
      { prestadorId: 128, total: 2 },
      { prestadorId: 145, total: 1 },
    ])
    expect(r.prestadoresUnicos).toBe(2)
  })

  it('distribui por dia de Brasília e ignora cliques fora do período', () => {
    const r = resumirCliques(
      [
        clique({ created_at: '2026-10-27T22:00:00Z' }),
        clique({ created_at: '2026-10-28T01:00:00Z' }), // ainda 27/10 em Brasília
        clique({ created_at: '2026-10-26T15:00:00Z' }),
        clique({ created_at: '2026-09-01T12:00:00Z' }), // fora do período
      ],
      AGORA,
      3,
    )
    expect(r.porDia).toEqual([
      { dia: '2026-10-25', total: 0 },
      { dia: '2026-10-26', total: 1 },
      { dia: '2026-10-27', total: 2 },
    ])
  })
})
