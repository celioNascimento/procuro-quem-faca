import { describe, expect, it, vi } from 'vitest'
import { buscarTodasAsLinhas } from '@/lib/supabase/paginar'

const linhas = (n: number, inicio = 0) => Array.from({ length: n }, (_, i) => ({ id: inicio + i }))

describe('buscarTodasAsLinhas', () => {
  it('uma página incompleta termina na primeira consulta', async () => {
    const consulta = vi.fn().mockResolvedValue({ data: linhas(3), error: null })
    expect(await buscarTodasAsLinhas(consulta, 5)).toHaveLength(3)
    expect(consulta).toHaveBeenCalledTimes(1)
    expect(consulta).toHaveBeenCalledWith(0, 4)
  })

  it('junta várias páginas e pede as faixas certas', async () => {
    const consulta = vi.fn()
      .mockResolvedValueOnce({ data: linhas(5, 0), error: null })
      .mockResolvedValueOnce({ data: linhas(5, 5), error: null })
      .mockResolvedValueOnce({ data: linhas(2, 10), error: null })
    const todas = await buscarTodasAsLinhas<{ id: number }>(consulta, 5)
    expect(todas.map(l => l.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(consulta.mock.calls).toEqual([[0, 4], [5, 9], [10, 14]])
  })

  it('quando a última página vem cheia, ainda confere a seguinte', async () => {
    const consulta = vi.fn()
      .mockResolvedValueOnce({ data: linhas(5), error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    expect(await buscarTodasAsLinhas(consulta, 5)).toHaveLength(5)
    expect(consulta).toHaveBeenCalledTimes(2)
  })

  it('resposta sem dados vira lista vazia', async () => {
    const consulta = vi.fn().mockResolvedValue({ data: null, error: null })
    expect(await buscarTodasAsLinhas(consulta, 5)).toEqual([])
  })

  it('propaga o erro do banco', async () => {
    const consulta = vi.fn().mockResolvedValue({ data: null, error: new Error('falhou') })
    await expect(buscarTodasAsLinhas(consulta, 5)).rejects.toThrow('falhou')
  })
})
