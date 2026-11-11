import { beforeEach, describe, expect, it, vi } from 'vitest'

const chamadas: Array<[string, ...unknown[]]> = []
let erro: unknown = null

function cadeia() {
  const c: Record<string, unknown> = {}
  for (const metodo of ['delete', 'eq', 'neq']) {
    c[metodo] = (...args: unknown[]) => { chamadas.push([metodo, ...args]); return c }
  }
  c.then = (ok: (v: unknown) => unknown) => Promise.resolve({ error: erro }).then(ok)
  return c
}

vi.mock('@/lib/supabase', () => ({ supabase: { from: () => cadeia() } }))

import { deletarOutrosPrestadoresDoUsuario } from '@/lib/services/cadastroPrestador.service'

beforeEach(() => { chamadas.length = 0; erro = null })

describe('deletarOutrosPrestadoresDoUsuario', () => {
  it('apaga só rascunhos (status pendente) da conta, nunca um perfil ativo', async () => {
    await deletarOutrosPrestadoresDoUsuario('user-1', 1592)

    expect(chamadas).toEqual([
      ['delete'],
      ['eq', 'user_id', 'user-1'],
      ['eq', 'status', 'pendente'],
      ['neq', 'id', 1592],
    ])
  })

  it('propaga o erro do banco', async () => {
    erro = new Error('falhou')
    await expect(deletarOutrosPrestadoresDoUsuario('user-1', 1592)).rejects.toThrow('falhou')
  })
})
