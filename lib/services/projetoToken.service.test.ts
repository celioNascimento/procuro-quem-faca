import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { obterProjetoIdPorToken, buscarTokensDosProjetos, anexarTokens } from '@/lib/services/projetoToken.service'

const rpc = () => vi.mocked(supabase.rpc)

describe('projetoToken.service', () => {
  beforeEach(() => vi.resetAllMocks())

  it('obterProjetoIdPorToken chama a função do banco e devolve o id', async () => {
    rpc().mockResolvedValue({ data: 'p1', error: null } as never)
    await expect(obterProjetoIdPorToken('tok')).resolves.toBe('p1')
    expect(rpc()).toHaveBeenCalledWith('projeto_id_por_token', { p_token: 'tok' })
  })

  it('obterProjetoIdPorToken devolve null quando não existe', async () => {
    rpc().mockResolvedValue({ data: null, error: null } as never)
    await expect(obterProjetoIdPorToken('x')).resolves.toBeNull()
  })

  it('obterProjetoIdPorToken propaga erro do banco', async () => {
    rpc().mockResolvedValue({ data: null, error: new Error('falhou') } as never)
    await expect(obterProjetoIdPorToken('x')).rejects.toThrow('falhou')
  })

  it('buscarTokensDosProjetos não chama o banco sem ids', async () => {
    await expect(buscarTokensDosProjetos([])).resolves.toEqual({})
    expect(rpc()).not.toHaveBeenCalled()
  })

  it('anexarTokens preenche o token dos que o chamador pode ver e deixa vazio nos demais', async () => {
    rpc().mockResolvedValue({ data: [{ projeto_id: 'a', avaliacao_token: 't-a' }], error: null } as never)
    const r = await anexarTokens([{ id: 'a' }, { id: 'b' }])
    expect(r).toEqual([
      { id: 'a', avaliacao_token: 't-a' },
      { id: 'b', avaliacao_token: '' },
    ])
    expect(rpc()).toHaveBeenCalledWith('tokens_projetos', { p_ids: ['a', 'b'] })
  })
})
