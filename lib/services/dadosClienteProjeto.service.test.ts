import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }))

import {
  anexarDadosCliente,
  anonimizarMeusDadosDeCliente,
  buscarDadosClienteDosProjetos,
  nomeClientePorToken,
} from '@/lib/services/dadosClienteProjeto.service'

beforeEach(() => { vi.clearAllMocks() })

describe('buscarDadosClienteDosProjetos', () => {
  it('sem projetos não chama o banco', async () => {
    expect(await buscarDadosClienteDosProjetos([])).toEqual({})
    expect(rpc).not.toHaveBeenCalled()
  })

  it('devolve os dados indexados pelo id do projeto', async () => {
    rpc.mockResolvedValue({
      data: [{ projeto_id: 'p1', cliente_whatsapp: '43999990000', cliente_nome: 'Maria' }],
      error: null,
    })
    const mapa = await buscarDadosClienteDosProjetos(['p1', 'p2'])
    expect(rpc).toHaveBeenCalledWith('dados_cliente_projetos', { p_ids: ['p1', 'p2'] })
    expect(mapa).toEqual({ p1: { cliente_whatsapp: '43999990000', cliente_nome: 'Maria' } })
  })

  it('propaga o erro do banco', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('falhou') })
    await expect(buscarDadosClienteDosProjetos(['p1'])).rejects.toThrow('falhou')
  })
})

describe('anexarDadosCliente', () => {
  it('anexa nome e WhatsApp e deixa nulo o que o chamador não pode ver', async () => {
    rpc.mockResolvedValue({
      data: [{ projeto_id: 'p1', cliente_whatsapp: '43999990000', cliente_nome: 'Maria' }],
      error: null,
    })
    const linhas = await anexarDadosCliente([{ id: 'p1', titulo: 'Pintura' }, { id: 'p2', titulo: 'Reforma' }])
    expect(linhas[0]).toEqual({ id: 'p1', titulo: 'Pintura', cliente_whatsapp: '43999990000', cliente_nome: 'Maria' })
    expect(linhas[1]).toEqual({ id: 'p2', titulo: 'Reforma', cliente_whatsapp: null, cliente_nome: null })
  })

  it('lista vazia devolve lista vazia sem consultar o banco', async () => {
    expect(await anexarDadosCliente([])).toEqual([])
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('nomeClientePorToken', () => {
  it('devolve o nome informado pela função do banco', async () => {
    rpc.mockResolvedValue({ data: 'Maria', error: null })
    expect(await nomeClientePorToken('abc')).toBe('Maria')
    expect(rpc).toHaveBeenCalledWith('nome_cliente_por_token', { p_token: 'abc' })
  })

  it('token desconhecido ou sem login devolve null', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    expect(await nomeClientePorToken('abc')).toBeNull()
  })
})

describe('anonimizarMeusDadosDeCliente', () => {
  it('devolve quantos projetos foram limpos', async () => {
    rpc.mockResolvedValue({ data: 2, error: null })
    expect(await anonimizarMeusDadosDeCliente()).toBe(2)
    expect(rpc).toHaveBeenCalledWith('anonimizar_meus_dados_de_cliente')
  })
})
