import { describe, expect, it } from 'vitest'
import {
  emailNovaDenuncia,
  emailNovoPedidoTitular,
  emailResumoPendencias,
  normalizarPendencias,
  totalModeracao,
  totalPendencias,
} from '@/lib/notificacoes/mensagens'

const zeros = { titular_abertas: 0, titular_atrasadas: 0, denuncias_abertas: 0, garantias_abertas: 0, contestacoes_abertas: 0 }

describe('normalizarPendencias', () => {
  it('converte o JSON do banco em números', () => {
    expect(normalizarPendencias({ titular_abertas: 2, titular_atrasadas: '1', denuncias_abertas: 3 })).toEqual({
      ...zeros, titular_abertas: 2, titular_atrasadas: 1, denuncias_abertas: 3,
    })
  })
  it('troca valor inválido, negativo ou ausente por zero', () => {
    expect(normalizarPendencias({ titular_abertas: -4, denuncias_abertas: 'x', garantias_abertas: null })).toEqual(zeros)
    expect(normalizarPendencias(null)).toEqual(zeros)
    expect(normalizarPendencias(undefined)).toEqual(zeros)
  })
})

describe('totais', () => {
  it('atrasadas já estão dentro das abertas e não contam duas vezes', () => {
    expect(totalPendencias({ ...zeros, titular_abertas: 2, titular_atrasadas: 2, denuncias_abertas: 1 })).toBe(3)
  })
  it('moderação soma denúncias, garantias e contestações', () => {
    expect(totalModeracao({ ...zeros, denuncias_abertas: 1, garantias_abertas: 2, contestacoes_abertas: 3 })).toBe(6)
  })
})

describe('e-mails', () => {
  it('pedido do titular leva tipo, protocolo e prazo, sem dado pessoal', () => {
    const e = emailNovoPedidoTitular({ tipo: 'exclusao', protocolo: 'AB12CD34', prazoTexto: '25/11/2026' })
    expect(e.assunto).toContain('Excluir meus dados')
    expect(e.texto).toContain('AB12CD34')
    expect(e.texto).toContain('25/11/2026')
    expect(e.texto).toContain('/admin/titular')
    expect(e.texto).not.toMatch(/@|whatsapp|\d{8,}/i)
  })

  it('denúncia aponta para a moderação', () => {
    expect(emailNovaDenuncia().texto).toContain('/admin/moderacao')
  })

  it('resumo diário vazio não gera e-mail', () => {
    expect(emailResumoPendencias(zeros, '20/11/2026')).toBeNull()
  })

  it('resumo lista só o que tem pendência e avisa do prazo vencido', () => {
    const e = emailResumoPendencias({ ...zeros, titular_abertas: 2, titular_atrasadas: 1, denuncias_abertas: 1 }, '20/11/2026')!
    expect(e.assunto).toContain('3 pendências')
    expect(e.assunto).toContain('prazo vencido')
    expect(e.texto).toContain('Pedidos de titulares de dados: 2 (1 com o prazo vencido)')
    expect(e.texto).toContain('Denúncias abertas: 1')
    expect(e.texto).not.toContain('Garantias')
  })

  it('usa singular com uma pendência', () => {
    const e = emailResumoPendencias({ ...zeros, denuncias_abertas: 1 }, '20/11/2026')!
    expect(e.assunto).toContain('1 pendência em')
  })
})
