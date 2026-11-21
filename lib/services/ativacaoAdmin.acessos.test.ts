import { beforeEach, describe, expect, it, vi } from 'vitest'

const estado = vi.hoisted(() => ({ nome: '', resposta: { data: null as unknown, error: null as unknown } }))
vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: (nome: string) => { estado.nome = nome; return Promise.resolve(estado.resposta) } },
}))

import { listarAcessosDasContas } from './ativacaoAdmin.service'

describe('listarAcessosDasContas', () => {
  beforeEach(() => { estado.resposta = { data: [{ prestador_id: 7, conta_criada: '2026-01-01T00:00:00Z', ultimo_acesso: '2026-02-01T00:00:00Z' }], error: null } })

  it('lê pela função do banco só de admin e normaliza o retorno', async () => {
    expect(await listarAcessosDasContas()).toEqual([{ prestadorId: 7, contaCriada: '2026-01-01T00:00:00Z', ultimoAcesso: '2026-02-01T00:00:00Z' }])
    expect(estado.nome).toBe('admin_acesso_das_contas')
  })

  it('propaga o erro do banco', async () => {
    estado.resposta = { data: null, error: new Error('negado') }
    await expect(listarAcessosDasContas()).rejects.toThrow('negado')
  })
})
