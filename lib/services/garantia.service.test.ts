import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import {
  abrirCasoGarantiaCliente,
  aceitarOfertaReparo,
  confirmarResolucaoGarantia,
  ErroGarantia,
  oferecerReparoPrestador,
  reabrirCasoGarantia,
  recusarOfertaReparo,
  responderCasoGarantia,
} from '@/lib/services/garantia.service'

const fetchMock = vi.fn()
const resposta = (ok: boolean, corpo: unknown) => ({ ok, json: async () => corpo })
const enviado = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body)

beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('garantia.service — escritas pela rota autenticada', () => {
  it('toda ação vai para POST /api/garantia/acao com o contrato esperado', async () => {
    fetchMock.mockResolvedValue(resposta(true, { id: 'c' }))
    await abrirCasoGarantiaCliente({ projetoId: 'p', descricaoProblema: 'desc' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/garantia/acao')
    expect(enviado()).toEqual({ acao: 'abrir', projetoId: 'p', texto: 'desc' })

    await oferecerReparoPrestador({ avaliacaoId: 'a', descricao: 'refaço' })
    expect(enviado()).toEqual({ acao: 'oferecer', avaliacaoId: 'a', texto: 'refaço' })

    await aceitarOfertaReparo('c1')
    expect(enviado()).toEqual({ acao: 'aceitar', casoId: 'c1' })
    await recusarOfertaReparo('c1')
    expect(enviado()).toEqual({ acao: 'recusar', casoId: 'c1' })
    await responderCasoGarantia('c1', 'ok')
    expect(enviado()).toEqual({ acao: 'responder', casoId: 'c1', texto: 'ok' })
    await reabrirCasoGarantia('c1')
    expect(enviado()).toEqual({ acao: 'reabrir', casoId: 'c1' })
    await confirmarResolucaoGarantia('c1', 'feito', ['f.jpg'], 4)
    expect(enviado()).toEqual({ acao: 'confirmar', casoId: 'c1', texto: 'feito', fotos: ['f.jpg'], nota: 4 })
  })

  it('devolve o caso atualizado', async () => {
    fetchMock.mockResolvedValue(resposta(true, { id: 'c1', status: 'respondida' }))
    await expect(responderCasoGarantia('c1', 'ok')).resolves.toEqual({ id: 'c1', status: 'respondida' })
  })

  it('erro da rota vira ErroGarantia com a mensagem em português', async () => {
    fetchMock.mockResolvedValue(resposta(false, { error: 'Já existe um caso em andamento para este serviço.' }))
    const falha = abrirCasoGarantiaCliente({ projetoId: 'p', descricaoProblema: 'd' })
    await expect(falha).rejects.toBeInstanceOf(ErroGarantia)
    await expect(falha).rejects.toThrow('Já existe um caso em andamento')
  })

  it('sem internet vira mensagem amigável', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(reabrirCasoGarantia('c1')).rejects.toThrow('Sem conexão')
  })

  it('resposta sem corpo JSON ainda dá erro amigável', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => { throw new Error('x') } })
    await expect(reabrirCasoGarantia('c1')).rejects.toThrow('Não foi possível concluir')
  })
})
