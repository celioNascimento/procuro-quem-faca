import { describe, expect, it } from 'vitest'
import { lerTrafego, normalizarResumo, RESUMO_VAZIO, type ResumoTrafego } from './trafego'

const base: ResumoTrafego = {
  dias: 30,
  buscas: { total: 100, equipe: 40, logados: 10, anonimas: 50 },
  visitas_via_busca: { total: 200, equipe: 5, anonimas: 190, perfis_distintos_anonimos: 150 },
  dias_suspeitos: 2,
  visitas_perfil: { total: 60, com_sessao: 40, sem_sessao: 20 },
}

describe('lerTrafego', () => {
  it('separa o que é de fora da equipe e o que é confiável', () => {
    const l = lerTrafego(base)
    expect(l.buscasDeFora).toBe(60)
    expect(l.visitasDeFora).toBe(195)
    expect(l.visitasConfiaveis).toBe(40)
    expect(l.visitasSemFiltro).toBe(20)
    expect(l.pctEquipeNasBuscas).toBe(40)
  })
  it('avisa sobre dias suspeitos, peso da equipe e gravação antiga', () => {
    const t = lerTrafego(base).alertas.join(' | ')
    expect(t).toMatch(/2 dias tiveram/)
    expect(t).toMatch(/40% das buscas/)
    expect(t).toMatch(/método antigo/)
  })
  it('singular para 1 dia suspeito; sem problemas, sem alertas', () => {
    expect(lerTrafego({ ...base, dias_suspeitos: 1 }).alertas[0]).toMatch(/1 dia teve/)
    expect(lerTrafego({ ...RESUMO_VAZIO }).alertas).toEqual([])
  })
  it('poucas buscas não disparam o alerta de equipe (amostra pequena)', () => {
    expect(lerTrafego({ ...RESUMO_VAZIO, buscas: { total: 4, equipe: 4, logados: 0, anonimas: 0 } }).alertas).toEqual([])
  })
})

describe('normalizarResumo', () => {
  it('aceita o que vem do banco e completa o que falta com zero', () => {
    expect(normalizarResumo({ dias: 7, buscas: { total: 3 } }).buscas).toEqual({ total: 3, equipe: 0, logados: 0, anonimas: 0 })
    expect(normalizarResumo(null)).toEqual(RESUMO_VAZIO)
    expect(normalizarResumo({ dias_suspeitos: '2' }).dias_suspeitos).toBe(2)
  })
})
