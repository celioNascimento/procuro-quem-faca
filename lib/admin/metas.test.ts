import { describe, expect, it } from 'vitest'
import { META_CONTAS, META_TRABALHOS_NO_FEED, progressoDaMeta } from './metas'

describe('metas do mês', () => {
  it('seguem o plano de 30 dias: 10 contas e 3 trabalhos no feed', () => {
    expect(META_CONTAS).toBe(10)
    expect(META_TRABALHOS_NO_FEED).toBe(3)
  })

  it('progresso em porcentagem, limitado a 100', () => {
    expect(progressoDaMeta(0, 10)).toEqual({ pct: 0, cumprida: false })
    expect(progressoDaMeta(4, 10)).toEqual({ pct: 40, cumprida: false })
    expect(progressoDaMeta(10, 10)).toEqual({ pct: 100, cumprida: true })
    expect(progressoDaMeta(15, 10)).toEqual({ pct: 100, cumprida: true })
  })

  it('valor negativo ou meta inválida não quebram a barra', () => {
    expect(progressoDaMeta(-2, 10).pct).toBe(0)
    expect(progressoDaMeta(3, 0)).toEqual({ pct: 0, cumprida: false })
  })
})
