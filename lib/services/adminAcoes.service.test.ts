import { beforeEach, describe, expect, it, vi } from 'vitest'

const estado = vi.hoisted(() => ({ tabela: '', limite: 0, ordem: null as unknown, resposta: { data: [] as unknown[] | null, error: null as unknown } }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from(t: string) {
      estado.tabela = t
      return {
        select() { return this },
        order(...args: unknown[]) { estado.ordem = args; return this },
        limit(n: number) { estado.limite = n; return Promise.resolve(estado.resposta) },
      }
    },
  },
}))

import { listarAcoesAdmin, LIMITE_ACOES } from './adminAcoes.service'

describe('listarAcoesAdmin', () => {
  beforeEach(() => { estado.resposta = { data: [{ id: 1 }], error: null } })

  it('lê o registro do mais novo para o mais antigo, com limite', async () => {
    expect(await listarAcoesAdmin()).toEqual([{ id: 1 }])
    expect(estado.tabela).toBe('admin_acoes')
    expect(estado.ordem).toEqual(['quando', { ascending: false }])
    expect(estado.limite).toBe(LIMITE_ACOES)
  })

  it('devolve lista vazia quando não há dados e propaga o erro do banco', async () => {
    estado.resposta = { data: null, error: null }
    expect(await listarAcoesAdmin()).toEqual([])
    estado.resposta = { data: null, error: new Error('negado') }
    await expect(listarAcoesAdmin()).rejects.toThrow('negado')
  })
})
