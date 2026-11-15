import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { rpc, from: vi.fn() } }))

import {
  abrirCasoGarantiaCliente, oferecerReparoPrestador, aceitarOfertaReparo, recusarOfertaReparo,
  responderCasoGarantia, confirmarResolucaoGarantia, reabrirCasoGarantia,
} from './garantia.service'

const caso = { id: 'c1', status: 'aberta' }

describe('garantia.service — tudo passa pelas funções do banco', () => {
  beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue({ data: caso, error: null }) })

  it('abrir: manda só projeto e descrição (tipo, prazo e dono o banco decide)', async () => {
    await expect(abrirCasoGarantiaCliente({ projetoId: 'p1', descricaoProblema: 'vazando de novo' })).resolves.toEqual(caso)
    expect(rpc).toHaveBeenCalledWith('garantia_abrir_caso', { p_projeto_id: 'p1', p_descricao: 'vazando de novo' })
  })

  it('oferecer reparo, aceitar, recusar, responder e reabrir chamam a função certa', async () => {
    await oferecerReparoPrestador({ avaliacaoId: 'a1', descricaoProblema: 'refaço o reparo' })
    await aceitarOfertaReparo('c1')
    await recusarOfertaReparo('c1')
    await responderCasoGarantia('c1', 'vou na sexta')
    await reabrirCasoGarantia('c1')
    expect(rpc.mock.calls).toEqual([
      ['garantia_oferecer_reparo', { p_avaliacao_id: 'a1', p_descricao: 'refaço o reparo' }],
      ['garantia_aceitar_oferta', { p_caso_id: 'c1' }],
      ['garantia_recusar_oferta', { p_caso_id: 'c1' }],
      ['garantia_responder', { p_caso_id: 'c1', p_resposta: 'vou na sexta' }],
      ['garantia_reabrir', { p_caso_id: 'c1' }],
    ])
  })

  it('confirmar resolução: a nota vai como pedido pelo cliente, e nula quando não há', async () => {
    await confirmarResolucaoGarantia('c1', 'ficou ótimo', ['c1/a.jpg'], 5)
    await confirmarResolucaoGarantia('c1', '', [], undefined)
    expect(rpc.mock.calls[0]).toEqual(['garantia_confirmar_resolucao', { p_caso_id: 'c1', p_descricao: 'ficou ótimo', p_fotos: ['c1/a.jpg'], p_nova_nota: 5 }])
    expect(rpc.mock.calls[1][1].p_nova_nota).toBeNull()
  })

  it('o motivo escrito pelo banco em português chega à pessoa', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'O prazo para abrir este caso já terminou.' } })
    await expect(abrirCasoGarantiaCliente({ projetoId: 'p1', descricaoProblema: 'x'.repeat(30) }))
      .rejects.toThrow('O prazo para abrir este caso já terminou.')
  })

  it('erro técnico (rede, permissão) vira frase genérica — nunca texto em inglês na tela', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied for table solicitacoes_garantia' } })
    await expect(reabrirCasoGarantia('c1')).rejects.toThrow('Não foi possível concluir agora. Tente novamente em instantes.')
  })
})
