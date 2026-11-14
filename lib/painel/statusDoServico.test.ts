import { describe, it, expect } from 'vitest'
import { estaProntoParaAvaliar, statusVisualDoServico } from './statusDoServico'

describe('estaProntoParaAvaliar', () => {
  it('com fotos: só com a foto final (ordem 3)', () => {
    expect(estaProntoParaAvaliar({ portfolio_fotos: [{ ordem: 1 }, { ordem: 2 }] })).toBe(false)
    expect(estaProntoParaAvaliar({ portfolio_fotos: [{ ordem: 1 }, { ordem: 3 }] })).toBe(true)
  })
  it('sem fotos: só depois de marcado como concluído', () => {
    expect(estaProntoParaAvaliar({ sem_fotos: true, portfolio_fotos: [] })).toBe(false)
    expect(estaProntoParaAvaliar({ sem_fotos: true, marcado_concluido_at: '2026-11-01' })).toBe(true)
  })
})

describe('statusVisualDoServico', () => {
  it('usa os mesmos nomes em qualquer tela', () => {
    expect(statusVisualDoServico({ status: 'pendente' }).label).toBe('Aguardando aceite')
    expect(statusVisualDoServico({ status: 'aguardando_aceite' }).label).toBe('Aguardando aceite')
    expect(statusVisualDoServico({ status: 'em_execucao' }).label).toBe('Em andamento')
    expect(statusVisualDoServico({ status: 'em_execucao', pronto: true }).label).toBe('Avaliar agora')
    expect(statusVisualDoServico({ status: 'finalizado' }).label).toBe('Concluído')
    expect(statusVisualDoServico({ status: 'FINALIZADO', jaAvaliado: true }).label).toBe('Concluído')
  })
  it('caso de garantia ou reclamação ganha do status', () => {
    expect(statusVisualDoServico({ status: 'finalizado', caso: 'garantia' }).label).toBe('Garantia')
    expect(statusVisualDoServico({ status: 'em_execucao', caso: 'reclamacao' }).urgente).toBe(true)
  })
  it('nunca mostra o código interno do status', () => {
    for (const s of ['em_registro', 'em_disputa', 'qualquer_coisa', undefined, null]) {
      expect(statusVisualDoServico({ status: s }).label).not.toMatch(/_/)
    }
    expect(statusVisualDoServico({ status: 'em_registro' }).label).toBe('Em preparo')
  })
})
