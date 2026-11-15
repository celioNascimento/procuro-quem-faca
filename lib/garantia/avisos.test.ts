import { describe, expect, it } from 'vitest'
import {
  dataCurta, fraseDoPrazo, hojeEmSaoPaulo, pedeRespostaDoPrestador, pedeRetornoDoCliente, prazoMaisProximo,
} from './avisos'

describe('quem precisa agir', () => {
  it('prestador responde só caso aberta', () => {
    expect(pedeRespostaDoPrestador({ status: 'aberta' })).toBe(true)
    for (const s of ['respondida', 'aguardando_aceite_cliente', 'resolvida', 'sem_resposta', 'recusada']) {
      expect(pedeRespostaDoPrestador({ status: s })).toBe(false)
    }
  })
  it('cliente decide em respondida e na oferta de reparo, e em mais nenhum', () => {
    expect(pedeRetornoDoCliente({ status: 'respondida' })).toBe(true)
    expect(pedeRetornoDoCliente({ status: 'aguardando_aceite_cliente' })).toBe(true)
    for (const s of ['aberta', 'resolvida', 'sem_resposta', 'recusada']) {
      expect(pedeRetornoDoCliente({ status: s })).toBe(false)
    }
  })
})

describe('datas', () => {
  it('formata dia/mês e aceita lixo sem quebrar', () => {
    expect(dataCurta('2026-11-18')).toBe('18/11')
    expect(dataCurta('2026-11-18T10:00:00Z')).toBe('18/11')
    expect(dataCurta(null)).toBe('')
    expect(dataCurta('ontem')).toBe('')
  })
  it('hoje usa o horário de São Paulo (23h30 de Brasília ainda é o mesmo dia)', () => {
    expect(hojeEmSaoPaulo(new Date('2026-11-16T02:30:00Z'))).toBe('2026-11-15') // 23:30 em SP
    expect(hojeEmSaoPaulo(new Date('2026-11-16T03:30:00Z'))).toBe('2026-11-16') // 00:30 em SP
  })
  it('frase do prazo: futuro, hoje e vencido', () => {
    expect(fraseDoPrazo('2026-11-18', '2026-11-15')).toBe('prazo até 18/11')
    expect(fraseDoPrazo('2026-11-15', '2026-11-15')).toBe('o prazo termina hoje')
    expect(fraseDoPrazo('2026-11-13', '2026-11-15')).toBe('o prazo terminou em 13/11')
    expect(fraseDoPrazo(null, '2026-11-15')).toBe('')
  })
  it('o prazo mais próximo ignora casos que não esperam o prestador', () => {
    expect(prazoMaisProximo([
      { status: 'aberta', prazo_resposta: '2026-11-20' },
      { status: 'aberta', prazo_resposta: '2026-11-18' },
      { status: 'respondida', prazo_resposta: '2026-11-10' },
      { status: 'aberta', prazo_resposta: null },
    ])).toBe('2026-11-18')
    expect(prazoMaisProximo([{ status: 'respondida', prazo_resposta: '2026-11-10' }])).toBeNull()
  })
})
