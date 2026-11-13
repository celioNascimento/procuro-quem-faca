import { beforeEach, describe, expect, it, vi } from 'vitest'

const eqMock = vi.fn()
const updateMock = vi.fn()
let tabela = ''

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (nome: string) => {
      tabela = nome
      return { update: (dados: unknown) => { updateMock(dados); return { eq: eqMock } } }
    },
  },
}))

import { salvarVitrine } from '@/lib/services/vitrine.service'

beforeEach(() => { vi.clearAllMocks(); tabela = '' })

describe('salvarVitrine', () => {
  it('grava título e fotos limpos no perfil do prestador', async () => {
    eqMock.mockResolvedValue({ error: null })
    const r = await salvarVitrine(7, { titulo: '  Meus bolos ', fotos: ['a', '', 'b'] })
    expect(tabela).toBe('prestadores')
    expect(updateMock).toHaveBeenCalledWith({ sessao_fotos_titulo: 'Meus bolos', sessao_fotos_urls: ['a', 'b'] })
    expect(eqMock).toHaveBeenCalledWith('id', 7)
    expect(r).toEqual({ titulo: 'Meus bolos', fotos: ['a', 'b'] })
  })

  it('título vazio vira nulo no banco (a tela pública usa o padrão)', async () => {
    eqMock.mockResolvedValue({ error: null })
    await salvarVitrine(7, { titulo: '   ', fotos: ['a'] })
    expect(updateMock).toHaveBeenCalledWith({ sessao_fotos_titulo: null, sessao_fotos_urls: ['a'] })
  })

  it('remover todas as fotos grava lista vazia', async () => {
    eqMock.mockResolvedValue({ error: null })
    await salvarVitrine(7, { titulo: 'x', fotos: [] })
    expect(updateMock).toHaveBeenCalledWith({ sessao_fotos_titulo: 'x', sessao_fotos_urls: [] })
  })

  it('propaga o erro do banco', async () => {
    eqMock.mockResolvedValue({ error: new Error('sem permissão') })
    await expect(salvarVitrine(7, { fotos: ['a'] })).rejects.toThrow('sem permissão')
  })
})
