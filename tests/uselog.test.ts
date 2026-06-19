import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ─── Mock do serviço de log ────────────────────────────────────────────────────
const mockInsertLog = vi.fn()

vi.mock('../lib/db/logs', () => ({
  insertLog: (...args: unknown[]) => mockInsertLog(...args),
}))

import { useLog } from '../hooks/useLog'

describe('useLog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('chama insertLog com os parâmetros corretos', async () => {
    mockInsertLog.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useLog())

    await act(async () => {
      await result.current.registrarLog(
        'criar_orcamento',
        { valor: 500 },
        'orcamento',
        'orc-99',
      )
    })

    expect(mockInsertLog).toHaveBeenCalledWith({
      acao: 'criar_orcamento',
      detalhes: { valor: 500 },
      entidadeTipo: 'orcamento',
      entidadeId: 'orc-99',
    })
  })

  it('usa defaults quando parâmetros opcionais são omitidos', async () => {
    mockInsertLog.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useLog())

    await act(async () => {
      await result.current.registrarLog('login')
    })

    expect(mockInsertLog).toHaveBeenCalledWith({
      acao: 'login',
      detalhes: {},
      entidadeTipo: null,
      entidadeId: null,
    })
  })

  it('engole o erro silenciosamente (não lança)', async () => {
    mockInsertLog.mockRejectedValueOnce(new Error('falha de rede'))

    const { result } = renderHook(() => useLog())

    // Não deve lançar para o caller
    await expect(
      act(async () => {
        await result.current.registrarLog('acao_qualquer')
      })
    ).resolves.not.toThrow()
  })

  it('registrarLog é estável entre re-renders (useCallback)', () => {
    const { result, rerender } = renderHook(() => useLog())
    const primeira = result.current.registrarLog
    rerender()
    expect(result.current.registrarLog).toBe(primeira)
  })
})