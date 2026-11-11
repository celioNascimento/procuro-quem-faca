import { describe, expect, it } from 'vitest'
import { formatarDataPrazo, situacaoPrazo, statusEstaAberto } from '@/lib/titular/prazo'

const hoje = new Date(2026, 10, 20, 15, 30) // 20/11/2026, à tarde

describe('situacaoPrazo', () => {
  it('pedido encerrado não tem prazo', () => {
    expect(situacaoPrazo('2026-11-01', 'atendida', hoje)).toEqual({ tipo: 'encerrada' })
    expect(situacaoPrazo('2026-11-01', 'negada', hoje)).toEqual({ tipo: 'encerrada' })
  })
  it('vence hoje, sem considerar o horário', () => {
    expect(situacaoPrazo('2026-11-20', 'recebida', hoje)).toEqual({ tipo: 'hoje' })
  })
  it('atrasado conta os dias', () => {
    expect(situacaoPrazo('2026-11-17', 'em_analise', hoje)).toEqual({ tipo: 'atrasada', dias: 3 })
  })
  it('dentro do prazo conta os dias restantes', () => {
    expect(situacaoPrazo('2026-11-25', 'recebida', hoje)).toEqual({ tipo: 'no_prazo', dias: 5 })
  })
  it('funciona na virada de mês e de ano', () => {
    expect(situacaoPrazo('2027-01-02', 'recebida', new Date(2026, 11, 30))).toEqual({ tipo: 'no_prazo', dias: 3 })
  })
})

describe('apoio', () => {
  it('status aberto', () => {
    expect(statusEstaAberto('recebida')).toBe(true)
    expect(statusEstaAberto('em_analise')).toBe(true)
    expect(statusEstaAberto('atendida')).toBe(false)
  })
  it('formata a data para o padrão brasileiro', () => {
    expect(formatarDataPrazo('2026-11-25')).toBe('25/11/2026')
  })
})
