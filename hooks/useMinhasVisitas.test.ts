import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/lib/db/resumoVisitas', () => ({ buscarResumoVisitas: vi.fn() }))

import { buscarResumoVisitas } from '@/lib/db/resumoVisitas'
import { useMinhasVisitas } from '@/hooks/useMinhasVisitas'

const resumo = { visitas7d: 2, visitas7dAnterior: 1, visitas30d: 5, visitas30dAnterior: 4, visitasTotal: 9 }

describe('useMinhasVisitas', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('começa carregando e entrega os dados', async () => {
    vi.mocked(buscarResumoVisitas).mockResolvedValue(resumo)
    const { result } = renderHook(() => useMinhasVisitas())

    expect(result.current.carregando).toBe(true)
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.dados).toEqual(resumo)
    expect(result.current.erro).toBe(false)
  })

  it('marca erro quando a consulta falha, sem derrubar o painel', async () => {
    vi.mocked(buscarResumoVisitas).mockRejectedValue(new Error('rede'))
    const { result } = renderHook(() => useMinhasVisitas())

    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.erro).toBe(true)
    expect(result.current.dados).toBeNull()
  })

  it('recarregar busca de novo e limpa o erro', async () => {
    vi.mocked(buscarResumoVisitas).mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce(resumo)
    const { result } = renderHook(() => useMinhasVisitas())
    await waitFor(() => expect(result.current.erro).toBe(true))

    await result.current.recarregar()
    await waitFor(() => expect(result.current.erro).toBe(false))
    expect(result.current.dados).toEqual(resumo)
  })
})
