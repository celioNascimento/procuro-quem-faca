import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks hoisted ─────────────────────────────────────────────────────────────
const { mockInsert, mockSingle, mockFrom, mockGetSession } = vi.hoisted(() => {
  const mockInsert = vi.fn()
  const mockSingle = vi.fn()
  const mockFrom = vi.fn()
  const mockGetSession = vi.fn()
  return { mockInsert, mockSingle, mockFrom, mockGetSession }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getSession: mockGetSession },
  },
}))

import { checkConsentLog, insertConsentLog } from '../lib/db/cookieConsent'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const sessao = (id = 'u1', email = 'celio@test.com') =>
  ({ data: { session: { user: { id, email } } } })
const semSessao = () => ({ data: { session: null } })

// ─── checkConsentLog ───────────────────────────────────────────────────────────
describe('checkConsentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({ single: mockSingle })
          })
        })
      })
    })
  })

  it('retorna true quando log existe', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'log-1' } })

    const result = await checkConsentLog('u1')

    expect(result).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('logs_atividades')
  })

  it('retorna false quando log não existe', async () => {
    mockSingle.mockResolvedValueOnce({ data: null })

    const result = await checkConsentLog('u1')

    expect(result).toBe(false)
  })
})

// ─── insertConsentLog ──────────────────────────────────────────────────────────
describe('insertConsentLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ insert: mockInsert })
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'vitest-browser' },
      writable: true, configurable: true,
    })
    Object.defineProperty(window, 'screen', {
      value: { width: 1920, height: 1080 },
      writable: true, configurable: true,
    })
  })

  it('insere na tabela correta com dados da sessão', async () => {
    mockGetSession.mockResolvedValueOnce(sessao())
    mockInsert.mockResolvedValueOnce({ error: null })

    await insertConsentLog()

    expect(mockFrom).toHaveBeenCalledWith('logs_atividades')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      acao: 'ACEITE_COOKIES',
      entidade_tipo: 'consentimento',
      usuario_id: 'u1',
      usuario_email: 'celio@test.com',
    }))
  })

  it('inclui navegador, resolução e data_aceite nos detalhes', async () => {
    mockGetSession.mockResolvedValueOnce(sessao())
    mockInsert.mockResolvedValueOnce({ error: null })

    await insertConsentLog()

    const payload = mockInsert.mock.calls[0][0]
    expect(payload.detalhes).toMatchObject({
      navegador: 'vitest-browser',
      resolucao: '1920x1080',
    })
    expect(payload.detalhes.data_aceite).toBeTruthy()
  })

  it('insere usuario_id null quando sem sessão', async () => {
    mockGetSession.mockResolvedValueOnce(semSessao())
    mockInsert.mockResolvedValueOnce({ error: null })

    await insertConsentLog()

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      usuario_id: null,
      usuario_email: null,
    }))
  })

  it('lança erro quando banco retorna error', async () => {
    mockGetSession.mockResolvedValueOnce(sessao())
    mockInsert.mockResolvedValueOnce({ error: new Error('constraint') })

    await expect(insertConsentLog()).rejects.toThrow('constraint')
  })
})