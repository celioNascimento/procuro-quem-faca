import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { reivindicarProjetoPorToken, avaliarProjeto } from '@/lib/services/avaliacao.service'

const rpc = () => vi.mocked(supabase.rpc)

describe('reivindicarProjetoPorToken', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('chama a função do banco com o token e devolve o resultado', async () => {
    rpc().mockResolvedValue({ data: 'vinculado', error: null } as never)

    await expect(reivindicarProjetoPorToken('abc')).resolves.toBe('vinculado')
    expect(rpc()).toHaveBeenCalledWith('reivindicar_projeto_por_token', { p_token: 'abc' })
  })

  it.each(['ja_vinculado', 'vinculado_outra_conta', 'prestador_dono', 'nao_encontrado', 'nao_autenticado'])(
    'repassa o resultado %s',
    async (resultado) => {
      rpc().mockResolvedValue({ data: resultado, error: null } as never)
      await expect(reivindicarProjetoPorToken('abc')).resolves.toBe(resultado)
    },
  )

  it('não bloqueia a página quando a função falha (ex.: migration ainda não aplicada)', async () => {
    rpc().mockResolvedValue({ data: null, error: { message: 'function does not exist' } } as never)

    await expect(reivindicarProjetoPorToken('abc')).resolves.toBeNull()
  })

  it('ignora um retorno desconhecido em vez de tratá-lo como vínculo', async () => {
    rpc().mockResolvedValue({ data: 'qualquer_coisa', error: null } as never)

    await expect(reivindicarProjetoPorToken('abc')).resolves.toBeNull()
  })
})

describe('avaliarProjeto', () => {
  const params = { projetoId: 'p1', nota: 5, comentario: 'ótimo', indica: true }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('chama a função do banco com os parâmetros certos e devolve avaliado', async () => {
    rpc().mockResolvedValue({ data: 'avaliado', error: null } as never)

    await expect(avaliarProjeto(params)).resolves.toBe('avaliado')
    expect(rpc()).toHaveBeenCalledWith('avaliar_projeto', {
      p_projeto_id: 'p1', p_nota: 5, p_comentario: 'ótimo', p_indica: true,
    })
  })

  it.each([
    'nao_autenticado', 'nao_encontrado', 'sem_vinculo', 'nao_e_dono',
    'projeto_nao_concluido', 'ja_avaliado', 'nota_invalida',
  ])('repassa o resultado %s sem lançar erro', async (resultado) => {
    rpc().mockResolvedValue({ data: resultado, error: null } as never)
    await expect(avaliarProjeto(params)).resolves.toBe(resultado)
  })

  it('lança quando o banco devolve erro (ex.: trigger de auto-avaliação)', async () => {
    rpc().mockResolvedValue({ data: null, error: { message: 'Um prestador não pode avaliar a si mesmo.' } } as never)
    await expect(avaliarProjeto(params)).rejects.toMatchObject({ message: expect.stringContaining('si mesmo') })
  })

  it('lança em vez de tratar uma resposta desconhecida como sucesso', async () => {
    rpc().mockResolvedValue({ data: 'qualquer_coisa', error: null } as never)
    await expect(avaliarProjeto(params)).rejects.toThrow(/inesperada/)
  })
})
