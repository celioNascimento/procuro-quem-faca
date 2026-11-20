import { beforeEach, describe, expect, it, vi } from 'vitest'

const supabase = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  return {
    maybeSingle,
    from: vi.fn(() => ({ select })),
    auth: { signInWithPassword: vi.fn(), signOut: vi.fn(), resetPasswordForEmail: vi.fn() },
  }
})
vi.mock('@/lib/supabase', () => ({ supabase }))

import { enviarLinkDeNovaSenha, loginAdmin } from '@/lib/services/adminAuth.service'
import {
  MSG_CREDENCIAIS_INVALIDAS,
  MSG_FALHA_AO_ENTRAR,
  MSG_FALHA_AO_ENVIAR_LINK,
  MSG_SEM_ACESSO_AO_PAINEL,
} from '@/lib/auth/adminLogin'

beforeEach(() => {
  vi.clearAllMocks()
  supabase.auth.signOut.mockResolvedValue({ error: null })
})

describe('loginAdmin', () => {
  it('senha ou e-mail errados: mensagem única, sem consultar o perfil de admin', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } })
    expect(await loginAdmin('a@b.com', 'x')).toBe(MSG_CREDENCIAIS_INVALIDAS)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('conta que não é de administrador: avisa e desconecta', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await loginAdmin('cliente@b.com', 'ok')).toBe(MSG_SEM_ACESSO_AO_PAINEL)
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('falha ao consultar o perfil de admin: mensagem de falha e desconecta (não deixa entrar)', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    supabase.maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await loginAdmin('a@b.com', 'ok')).toBe(MSG_FALHA_AO_ENTRAR)
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('administrador: entra sem mensagem e mantém a sessão', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    supabase.maybeSingle.mockResolvedValue({ data: { role: 'owner' }, error: null })
    expect(await loginAdmin('  admin@pqf.com.br ', 'ok')).toBeNull()
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'admin@pqf.com.br', password: 'ok' })
    expect(supabase.auth.signOut).not.toHaveBeenCalled()
  })
})

describe('enviarLinkDeNovaSenha', () => {
  it('pede o link com retorno para a página de recuperação do site', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    expect(await enviarLinkDeNovaSenha(' admin@pqf.com.br ', 'https://pqf.test')).toBeNull()
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('admin@pqf.com.br', { redirectTo: 'https://pqf.test/recuperar-senha' })
  })

  it('devolve mensagem simples quando o envio falha', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: { message: 'rate limit' } })
    expect(await enviarLinkDeNovaSenha('a@b.com', 'https://pqf.test')).toBe(MSG_FALHA_AO_ENVIAR_LINK)
  })
})
