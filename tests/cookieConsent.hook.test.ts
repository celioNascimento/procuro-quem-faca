import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ─── Mocks hoisted ─────────────────────────────────────────────────────────────
const { mockGetSession, mockCheckConsent, mockInsertConsent } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockCheckConsent = vi.fn()
  const mockInsertConsent = vi.fn()
  return { mockGetSession, mockCheckConsent, mockInsertConsent }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getSession: mockGetSession },
  },
}))

vi.mock('@/lib/db/cookieConsent', () => ({
  checkConsentLog: mockCheckConsent,
  insertConsentLog: mockInsertConsent,
}))

import { useCookieConsent } from '../hooks/useCookieConsent'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const sessao = (id = 'u1', email = 'celio@test.com') =>
  ({ data: { session: { user: { id, email } } } })
const semSessao = () => ({ data: { session: null } })

describe('useCookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('não exibe banner se localStorage já marcado', async () => {
    localStorage.setItem('app_cookie_consent', 'true')

    const { result } = renderHook(() => useCookieConsent())
    await act(async () => { await vi.runAllTimersAsync() })

    expect(result.current.isVisible).toBe(false)
    expect(mockCheckConsent).not.toHaveBeenCalled()
  })

  it('não exibe banner se usuário já tem log no banco', async () => {
    mockGetSession.mockResolvedValueOnce(sessao())
    mockCheckConsent.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useCookieConsent())
    await act(async () => { await vi.runAllTimersAsync() })

    expect(result.current.isVisible).toBe(false)
    expect(localStorage.getItem('app_cookie_consent')).toBe('true')
  })

  it('exibe banner após 1500ms quando não há consentimento', async () => {
    mockGetSession.mockResolvedValueOnce(semSessao())

    const { result } = renderHook(() => useCookieConsent())

    await act(async () => { await Promise.resolve() })
    expect(result.current.isVisible).toBe(false)

    await act(async () => { vi.advanceTimersByTime(1600) })
    expect(result.current.isVisible).toBe(true)
  })

  it('aceitar oculta banner, grava localStorage e chama insertConsentLog', async () => {
    mockGetSession.mockResolvedValueOnce(semSessao())
    mockInsertConsent.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useCookieConsent())
    await act(async () => { await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(1600) })

    await act(async () => { await result.current.aceitar() })

    expect(result.current.isVisible).toBe(false)
    expect(localStorage.getItem('app_cookie_consent')).toBe('true')
    expect(mockInsertConsent).toHaveBeenCalledOnce()
  })

  it('aceitar não lança mesmo se insertConsentLog falhar', async () => {
    // Silencia o console.error esperado pelo hook (ele loga o erro de propósito)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGetSession.mockResolvedValueOnce(semSessao())
    mockInsertConsent.mockRejectedValueOnce(new Error('rede'))

    const { result } = renderHook(() => useCookieConsent())
    await act(async () => { await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(1600) })

    await expect(
      act(async () => { await result.current.aceitar() })
    ).resolves.not.toThrow()

    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })
})