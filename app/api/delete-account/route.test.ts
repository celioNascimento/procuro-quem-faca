import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }))
const list = vi.fn()
const remove = vi.fn()
const deleteUser = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({ storage: { from: () => ({ list, remove }) }, auth: { admin: { deleteUser } } }),
}))

import { POST } from '@/app/api/delete-account/route'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  list.mockResolvedValue({ data: [], error: null })
  remove.mockResolvedValue({ error: null })
  deleteUser.mockResolvedValue({ error: null })
})

describe('POST /api/delete-account', () => {
  it('sem sessão, 401 e nada é apagado', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    expect((await POST()).status).toBe(401)
    expect(deleteUser).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('apaga os comprovantes pendentes da pasta do usuário antes de excluir a conta', async () => {
    list.mockResolvedValue({ data: [{ name: 'seguro-1.pdf' }, { name: 'cnd-2.pdf' }], error: null })
    const r = await POST()
    expect(list).toHaveBeenCalledWith('u1', expect.anything())
    expect(remove).toHaveBeenCalledWith(['u1/seguro-1.pdf', 'u1/cnd-2.pdf'])
    expect(deleteUser).toHaveBeenCalledWith('u1')
    expect(r.status).toBe(200)
  })

  it('sem comprovantes, não chama remove e exclui a conta', async () => {
    expect((await POST()).status).toBe(200)
    expect(remove).not.toHaveBeenCalled()
    expect(deleteUser).toHaveBeenCalled()
  })

  it('falha ao limpar arquivos não impede a exclusão da conta', async () => {
    list.mockRejectedValue(new Error('storage fora do ar'))
    expect((await POST()).status).toBe(200)
    expect(deleteUser).toHaveBeenCalled()
  })
})
