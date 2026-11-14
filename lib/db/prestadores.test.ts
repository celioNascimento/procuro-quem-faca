// lib/db/prestadores.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({ createPublicClient: () => ({}) }))

import { lerTodasAsPaginas } from '@/lib/db/prestadores'

const linhas = (n: number, inicio = 0) => Array.from({ length: n }, (_, i) => ({ id: inicio + i }))

describe('lerTodasAsPaginas', () => {
  it('lê tudo quando passa do limite de 1000 linhas por consulta', async () => {
    const todas = linhas(2300)
    const lerPagina = vi.fn(async (de: number, ate: number) => ({
      data: todas.slice(de, ate + 1), count: todas.length, error: null,
    }))
    const { data, error } = await lerTodasAsPaginas(lerPagina)
    expect(error).toBeNull()
    expect(data).toHaveLength(2300)
    expect(lerPagina).toHaveBeenCalledTimes(3)
    expect(lerPagina.mock.calls[1]).toEqual([1000, 1999])
  })

  it('continua certo se o servidor devolve menos linhas por página que o pedido', async () => {
    const todas = linhas(1500)
    const lerPagina = vi.fn(async (de: number) => ({
      data: todas.slice(de, de + 500), count: todas.length, error: null,
    }))
    const { data } = await lerTodasAsPaginas(lerPagina)
    expect(data).toHaveLength(1500)
    expect(new Set(data!.map(l => (l as { id: number }).id)).size).toBe(1500)
    expect(lerPagina).toHaveBeenCalledTimes(3)
  })

  it('uma página só quando cabe tudo', async () => {
    const lerPagina = vi.fn(async () => ({ data: linhas(40), count: 40, error: null }))
    const { data } = await lerTodasAsPaginas(lerPagina)
    expect(data).toHaveLength(40)
    expect(lerPagina).toHaveBeenCalledTimes(1)
  })

  it('lista vazia não entra em laço', async () => {
    const lerPagina = vi.fn(async () => ({ data: [], count: 0, error: null }))
    const { data } = await lerTodasAsPaginas(lerPagina)
    expect(data).toEqual([])
    expect(lerPagina).toHaveBeenCalledTimes(1)
  })

  it('devolve o erro e para', async () => {
    const erro = new Error('falhou')
    const lerPagina = vi.fn(async () => ({ data: null, count: null, error: erro }))
    const r = await lerTodasAsPaginas(lerPagina)
    expect(r).toEqual({ data: null, error: erro })
    expect(lerPagina).toHaveBeenCalledTimes(1)
  })
})
