import { describe, expect, it } from 'vitest'
import { DESTINATARIO_DO_EVENTO, mensagemGarantia, type EventoGarantia } from '@/lib/notificacoes/garantia'

describe('mensagemGarantia', () => {
  it('aviso ao prestador leva o link do painel dele e fala em reclamação quando for o caso', () => {
    const m = mensagemGarantia('aberto', 'prestador', 'reclamacao')
    expect(m.texto).toContain('reclamação')
    expect(m.texto).toContain('/dashboard')
  })

  it('aviso ao cliente leva o link do painel do cliente', () => {
    expect(mensagemGarantia('respondido', 'cliente', 'garantia').texto).toContain('/painel/perfil')
  })

  it('todo evento disparado por uma pessoa tem mensagem para o outro lado', () => {
    for (const [evento, dest] of Object.entries(DESTINATARIO_DO_EVENTO)) {
      expect(() => mensagemGarantia(evento as EventoGarantia, dest!, 'garantia')).not.toThrow()
    }
  })

  it('os dois lados recebem o aviso de prazo vencido e de oferta expirada', () => {
    for (const evento of ['sem_resposta', 'oferta_expirada'] as const) {
      expect(() => mensagemGarantia(evento, 'cliente')).not.toThrow()
      expect(() => mensagemGarantia(evento, 'prestador')).not.toThrow()
    }
  })

  it('combinação sem texto definido falha alto', () => {
    expect(() => mensagemGarantia('aberto', 'cliente')).toThrow()
  })

  it('não vaza conteúdo do caso: só texto fixo', () => {
    expect(mensagemGarantia('resolvido', 'prestador', 'garantia').texto).not.toMatch(/\d{5,}/)
  })
})
