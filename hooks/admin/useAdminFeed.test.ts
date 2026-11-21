import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const svc = vi.hoisted(() => ({ carregar: vi.fn(), remover: vi.fn(), devolver: vi.fn() }))
vi.mock('@/lib/services/adminFeed.service', () => ({
  carregarResumoFeed: svc.carregar, removerDoFeed: svc.remover, devolverAoFeed: svc.devolver,
}))

import { useAdminFeed } from './useAdminFeed'

const RESUMO = { itens: [{ projetoId: 'p1' }], porDia: [] }

describe('useAdminFeed', () => {
  beforeEach(() => {
    svc.carregar.mockReset().mockResolvedValue(RESUMO)
    svc.remover.mockReset().mockResolvedValue('ok')
    svc.devolver.mockReset().mockResolvedValue('ok')
  })

  it('carrega o resumo ao abrir', async () => {
    const { result } = renderHook(() => useAdminFeed())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.resumo).toEqual(RESUMO)
    expect(result.current.erro).toBeNull()
  })

  it('falha ao carregar mostra erro simples', async () => {
    svc.carregar.mockRejectedValue(new Error('rpc'))
    const { result } = renderHook(() => useAdminFeed())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.erro).toMatch(/Não foi possível carregar o feed/)
  })

  it('remover envia o motivo sem espaços nas pontas e recarrega a lista', async () => {
    const { result } = renderHook(() => useAdminFeed())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    let ok = false
    await act(async () => { ok = await result.current.remover('p1', '  Golpe  ') })
    expect(ok).toBe(true)
    expect(svc.remover).toHaveBeenCalledWith('p1', 'Golpe')
    expect(svc.carregar).toHaveBeenCalledTimes(2)
  })

  it('código de recusa do banco vira mensagem e não recarrega', async () => {
    svc.remover.mockResolvedValue('motivo_obrigatorio')
    const { result } = renderHook(() => useAdminFeed())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    let ok = true
    await act(async () => { ok = await result.current.remover('p1', 'x') })
    expect(ok).toBe(false)
    expect(result.current.erro).toMatch(/motivo/)
    expect(svc.carregar).toHaveBeenCalledTimes(1)
  })

  it('devolver chama a função certa; erro de rede vira mensagem simples', async () => {
    const { result } = renderHook(() => useAdminFeed())
    await waitFor(() => expect(result.current.carregando).toBe(false))
    await act(async () => { await result.current.devolver('p1') })
    expect(svc.devolver).toHaveBeenCalledWith('p1')
    svc.devolver.mockRejectedValue(new Error('rede'))
    await act(async () => { await result.current.devolver('p1') })
    expect(result.current.erro).toMatch(/Tente de novo/)
  })
})
