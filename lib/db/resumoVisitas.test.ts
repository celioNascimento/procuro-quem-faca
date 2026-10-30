import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }))

import { buscarResumoVisitas } from '@/lib/db/resumoVisitas'

describe('buscarResumoVisitas', () => {
  beforeEach(() => rpc.mockReset())

  it('chama a função do banco sem parâmetros e converte para camelCase', async () => {
    rpc.mockResolvedValue({
      data: [{ visitas_7d: 2, visitas_7d_anterior: 1, visitas_30d: 5, visitas_30d_anterior: 4, visitas_total: 9 }],
      error: null,
    })

    const resumo = await buscarResumoVisitas()

    expect(rpc).toHaveBeenCalledWith('resumo_visitas_prestador')
    expect(resumo).toEqual({ visitas7d: 2, visitas7dAnterior: 1, visitas30d: 5, visitas30dAnterior: 4, visitasTotal: 9 })
  })

  it('aceita números vindos como texto e valores nulos', async () => {
    rpc.mockResolvedValue({
      data: [{ visitas_7d: '3', visitas_7d_anterior: null, visitas_30d: '10', visitas_30d_anterior: undefined, visitas_total: '10' }],
      error: null,
    })

    expect(await buscarResumoVisitas()).toEqual({
      visitas7d: 3, visitas7dAnterior: 0, visitas30d: 10, visitas30dAnterior: 0, visitasTotal: 10,
    })
  })

  it('aceita a linha única fora de uma lista', async () => {
    rpc.mockResolvedValue({
      data: { visitas_7d: 1, visitas_7d_anterior: 0, visitas_30d: 1, visitas_30d_anterior: 0, visitas_total: 1 },
      error: null,
    })
    expect((await buscarResumoVisitas())?.visitasTotal).toBe(1)
  })

  it('devolve null quando o usuário não tem perfil de prestador (zero linhas)', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    expect(await buscarResumoVisitas()).toBeNull()

    rpc.mockResolvedValue({ data: null, error: null })
    expect(await buscarResumoVisitas()).toBeNull()
  })

  it('lança o erro do Supabase', async () => {
    const erro = new Error('permission denied for function resumo_visitas_prestador')
    rpc.mockResolvedValue({ data: null, error: erro })
    await expect(buscarResumoVisitas()).rejects.toBe(erro)
  })
})
