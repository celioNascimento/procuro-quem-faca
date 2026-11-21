import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const svc = vi.hoisted(() => ({ fetchLogsRecentes: vi.fn() }))
vi.mock('@/lib/services/adminLogs.service', () => svc)
vi.mock('@/lib/db/logs', () => ({ subscribeLogsAtividades: () => ({}) }))
vi.mock('@/lib/supabase', () => ({ supabase: { removeChannel: vi.fn() } }))

import { LIMITE_ATIVIDADE, useAdminLogs } from './useAdminLogs'

const log = (i: number) => ({ id: String(i), acao: 'CLIQUE_PERFIL', detalhes: null, usuario_email: null, created_at: '2026-11-20T12:00:00Z' })

describe('useAdminLogs: período e limite', () => {
  beforeEach(() => svc.fetchLogsRecentes.mockReset().mockResolvedValue([log(1)]))

  it('começa em 30 dias e pede os registros desse período', async () => {
    const { result } = renderHook(() => useAdminLogs())
    await waitFor(() => expect(result.current.logsFiltrados).toHaveLength(1))
    expect(result.current.periodoDias).toBe(30)
    expect(svc.fetchLogsRecentes).toHaveBeenCalledWith(LIMITE_ATIVIDADE, 30)
    expect(result.current.truncado).toBe(false)
  })

  it('trocar o período busca de novo com os dias escolhidos', async () => {
    const { result } = renderHook(() => useAdminLogs())
    await waitFor(() => expect(result.current.logsFiltrados).toHaveLength(1))
    act(() => result.current.setPeriodoDias(7))
    await waitFor(() => expect(svc.fetchLogsRecentes).toHaveBeenCalledWith(LIMITE_ATIVIDADE, 7))
  })

  it('avisa quando o período tem mais registros do que a tela carrega', async () => {
    svc.fetchLogsRecentes.mockResolvedValue(Array.from({ length: LIMITE_ATIVIDADE }, (_, i) => log(i)))
    const { result } = renderHook(() => useAdminLogs())
    await waitFor(() => expect(result.current.truncado).toBe(true))
  })
})
