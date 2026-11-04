import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: { rpc: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { reivindicarProjetoPorToken } from '@/lib/services/avaliacao.service'

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
