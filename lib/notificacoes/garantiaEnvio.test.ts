import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const getUserById = vi.fn()
const enviarEmail = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    auth: { admin: { getUserById } },
  }),
}))
vi.mock('@/lib/notificacoes/email', () => ({ enviarEmail: (...a: unknown[]) => enviarEmail(...a) }))

import { notificarGarantia } from '@/lib/notificacoes/garantiaEnvio'

const caso = { prestador_id: 7, cliente_user_id: 'c1', tipo: 'garantia' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('notificarGarantia', () => {
  it('cliente: usa o e-mail da conta do cliente', async () => {
    getUserById.mockResolvedValue({ data: { user: { email: 'cli@exemplo.com' } } })
    enviarEmail.mockResolvedValue({ enviado: true })
    await expect(notificarGarantia('respondido', 'cliente', caso)).resolves.toBe(true)
    expect(getUserById).toHaveBeenCalledWith('c1')
    expect(enviarEmail).toHaveBeenCalledWith(expect.objectContaining({ para: 'cli@exemplo.com' }))
  })

  it('prestador: descobre a conta pelo id do prestador', async () => {
    maybeSingle.mockResolvedValue({ data: { user_id: 'u-prest' } })
    getUserById.mockResolvedValue({ data: { user: { email: 'pre@exemplo.com' } } })
    enviarEmail.mockResolvedValue({ enviado: true })
    await notificarGarantia('aberto', 'prestador', caso)
    expect(getUserById).toHaveBeenCalledWith('u-prest')
  })

  it('prestador sem conta vinculada: não envia e não quebra', async () => {
    maybeSingle.mockResolvedValue({ data: { user_id: null } })
    await expect(notificarGarantia('aberto', 'prestador', caso)).resolves.toBe(false)
    expect(enviarEmail).not.toHaveBeenCalled()
  })

  it('conta sem e-mail: não envia', async () => {
    getUserById.mockResolvedValue({ data: { user: {} } })
    await expect(notificarGarantia('respondido', 'cliente', caso)).resolves.toBe(false)
  })

  it('qualquer falha vira false, nunca exceção', async () => {
    getUserById.mockRejectedValue(new Error('rede'))
    await expect(notificarGarantia('respondido', 'cliente', caso)).resolves.toBe(false)
  })
})
