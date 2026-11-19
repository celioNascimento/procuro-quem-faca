import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) } } }))
vi.mock('@/lib/services/portfolioDashboard.service', () => ({
  getPrestadorPerfilDoUsuario: vi.fn().mockResolvedValue({ id: 2 }),
  getProjetosPorPrestador: vi.fn(),
  getProjetoAtualizado: vi.fn(),
}))
vi.mock('@/lib/services/feed.service', () => ({ ocultarProjetoNoFeed: vi.fn() }))
import { getProjetosPorPrestador } from '@/lib/services/portfolioDashboard.service'
import { ocultarProjetoNoFeed } from '@/lib/services/feed.service'
import { usePortfolioDashboard } from './usePortfolioDashboard'

const trabalho = { id: 'p1', titulo: 'Bolo', status: 'finalizado', feed_aceito_em: '2026-11-19T10:00:00Z', feed_oculto: false, feed_revogado_em: null }

beforeEach(() => {
  vi.mocked(getProjetosPorPrestador).mockReset().mockResolvedValue([trabalho] as never)
  vi.mocked(ocultarProjetoNoFeed).mockReset()
})

describe('usePortfolioDashboard — Mostrar no feed', () => {
  it('ocultar muda na hora e chama o banco com ocultar=true', async () => {
    vi.mocked(ocultarProjetoNoFeed).mockResolvedValue('ok')
    const { result } = renderHook(() => usePortfolioDashboard())
    await waitFor(() => expect(result.current.projetos).toHaveLength(1))
    await act(async () => { await result.current.alternarFeed('p1') })
    expect(ocultarProjetoNoFeed).toHaveBeenCalledWith('p1', true)
    expect(result.current.projetos[0].feed_oculto).toBe(true)
    expect(result.current.erroFeed).toBeNull()
  })
  it('se o banco recusar, volta ao estado anterior e avisa', async () => {
    vi.mocked(ocultarProjetoNoFeed).mockResolvedValue('nao_e_dono')
    const { result } = renderHook(() => usePortfolioDashboard())
    await waitFor(() => expect(result.current.projetos).toHaveLength(1))
    await act(async () => { await result.current.alternarFeed('p1') })
    expect(result.current.projetos[0].feed_oculto).toBe(false)
    expect(result.current.erroFeed).toMatch(/Só quem registrou/)
  })
  it('se a chamada falhar (internet), volta e avisa', async () => {
    vi.mocked(ocultarProjetoNoFeed).mockRejectedValue(new Error('rede'))
    const { result } = renderHook(() => usePortfolioDashboard())
    await waitFor(() => expect(result.current.projetos).toHaveLength(1))
    await act(async () => { await result.current.alternarFeed('p1') })
    expect(result.current.projetos[0].feed_oculto).toBe(false)
    expect(result.current.erroFeed).toBeTruthy()
  })
  it('mostrar de novo chama o banco com ocultar=false', async () => {
    vi.mocked(getProjetosPorPrestador).mockResolvedValue([{ ...trabalho, feed_oculto: true }] as never)
    vi.mocked(ocultarProjetoNoFeed).mockResolvedValue('ok')
    const { result } = renderHook(() => usePortfolioDashboard())
    await waitFor(() => expect(result.current.projetos).toHaveLength(1))
    await act(async () => { await result.current.alternarFeed('p1') })
    expect(ocultarProjetoNoFeed).toHaveBeenCalledWith('p1', false)
    expect(result.current.projetos[0].feed_oculto).toBe(false)
  })
})
