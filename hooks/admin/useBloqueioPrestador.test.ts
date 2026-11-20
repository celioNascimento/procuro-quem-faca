import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const servico = vi.hoisted(() => ({ bloquear: vi.fn(), desbloquear: vi.fn() }))
vi.mock('@/lib/services/denuncia.service', () => ({
  bloquearPrestadorDenunciado: servico.bloquear,
  desbloquearPrestador: servico.desbloquear,
}))

import { MENSAGEM_SEM_MOTIVO, useBloqueioPrestador } from './useBloqueioPrestador'

describe('useBloqueioPrestador', () => {
  beforeEach(() => { servico.bloquear.mockReset().mockResolvedValue(undefined); servico.desbloquear.mockReset().mockResolvedValue(undefined) })

  it('não bloqueia sem motivo e avisa', async () => {
    const aoConcluir = vi.fn()
    const { result } = renderHook(() => useBloqueioPrestador(aoConcluir))
    let ok = true
    await act(async () => { ok = await result.current.bloquear(7, '   ') })
    expect(ok).toBe(false)
    expect(servico.bloquear).not.toHaveBeenCalled()
    expect(aoConcluir).not.toHaveBeenCalled()
    expect(result.current.erro).toBe(MENSAGEM_SEM_MOTIVO)
  })

  it('bloqueia com o motivo (sem espaços nas pontas) e avisa a tela', async () => {
    const aoConcluir = vi.fn()
    const { result } = renderHook(() => useBloqueioPrestador(aoConcluir))
    await act(async () => { await result.current.bloquear(7, '  Fotos de outra pessoa  ') })
    expect(servico.bloquear).toHaveBeenCalledWith(7, 'Fotos de outra pessoa')
    expect(aoConcluir).toHaveBeenCalledWith(7, true)
    expect(result.current.erro).toBeNull()
  })

  it('desbloqueia e avisa a tela', async () => {
    const aoConcluir = vi.fn()
    const { result } = renderHook(() => useBloqueioPrestador(aoConcluir))
    await act(async () => { await result.current.desbloquear(7) })
    expect(servico.desbloquear).toHaveBeenCalledWith(7)
    expect(aoConcluir).toHaveBeenCalledWith(7, false)
  })

  it('falha do banco mostra erro simples e não muda a tela', async () => {
    servico.bloquear.mockRejectedValue(new Error('rpc'))
    const aoConcluir = vi.fn()
    const { result } = renderHook(() => useBloqueioPrestador(aoConcluir))
    await act(async () => { await result.current.bloquear(7, 'motivo') })
    expect(aoConcluir).not.toHaveBeenCalled()
    expect(result.current.erro).toMatch(/Não foi possível bloquear/)
    expect(result.current.processando).toBe(false)
  })
})
