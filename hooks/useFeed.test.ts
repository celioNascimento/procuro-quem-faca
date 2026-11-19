import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('@/lib/services/feed.service', () => ({
  fetchFeed: vi.fn(), alternarCurtida: vi.fn(), seguirPrestador: vi.fn(), deixarDeSeguirPrestador: vi.fn(),
}))
import { alternarCurtida, deixarDeSeguirPrestador, fetchFeed, seguirPrestador } from '@/lib/services/feed.service'
import { useFeed } from './useFeed'
import type { FeedItem } from '@/lib/feed/feed'

const item = (id: string, prestadorId = 2): FeedItem => ({
  projetoId: id, titulo: 'T', descricao: '', concluidoEm: null,
  prestador: { id: prestadorId, nome: 'P', slug: 'p' + prestadorId, categoria: null, cidade: null },
  fotos: ['https://x/1.jpg'], totalCurtidas: 1, curtidoPorMim: false, seguindo: false,
})

beforeEach(() => { vi.mocked(fetchFeed).mockReset().mockResolvedValue([item('a'), item('b', 9)]) })

describe('useFeed', () => {
  it('carrega o feed e some o carregando', async () => {
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    expect(result.current.carregando).toBe(false)
    expect(fetchFeed).toHaveBeenCalledWith({ categoriaId: null, somenteSeguidos: false, pagina: 0 })
  })
  it('sem login, curtir e seguir só avisam, sem chamar o banco', async () => {
    const { result } = renderHook(() => useFeed(false))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.curtir('a') })
    expect(result.current.aviso).toMatch(/Entre na sua conta/)
    await act(async () => { await result.current.alternarSeguir(2) })
    expect(alternarCurtida).not.toHaveBeenCalled()
    expect(seguirPrestador).not.toHaveBeenCalled()
  })
  it('curtir logado atualiza com o total do banco', async () => {
    vi.mocked(alternarCurtida).mockResolvedValue({ curtido: true, total: 5 })
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.curtir('a') })
    expect(result.current.itens[0]).toMatchObject({ curtidoPorMim: true, totalCurtidas: 5 })
  })
  it('erro ao curtir desfaz a mudança e avisa', async () => {
    vi.mocked(alternarCurtida).mockResolvedValue({ erro: 'proprio_projeto' })
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.curtir('a') })
    expect(result.current.itens[0]).toMatchObject({ curtidoPorMim: false, totalCurtidas: 1 })
    expect(result.current.aviso).toMatch(/próprio trabalho/)
  })
  it('seguir marca todos os trabalhos do prestador; erro desfaz', async () => {
    vi.mocked(fetchFeed).mockResolvedValue([item('a'), item('c')])
    vi.mocked(seguirPrestador).mockResolvedValue('ok')
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.alternarSeguir(2) })
    expect(result.current.itens.map(i => i.seguindo)).toEqual([true, true])
    vi.mocked(deixarDeSeguirPrestador).mockResolvedValue('nao_autenticado')
    await act(async () => { await result.current.alternarSeguir(2) })
    expect(result.current.itens.map(i => i.seguindo)).toEqual([true, true])
    expect(result.current.aviso).toMatch(/Entre na sua conta/)
  })
  it('na aba Quem eu sigo, deixar de seguir tira o trabalho da lista', async () => {
    vi.mocked(fetchFeed).mockResolvedValue([{ ...item('a'), seguindo: true }])
    vi.mocked(deixarDeSeguirPrestador).mockResolvedValue('ok')
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(1))
    act(() => result.current.setAba('seguindo'))
    await waitFor(() => expect(fetchFeed).toHaveBeenLastCalledWith({ categoriaId: null, somenteSeguidos: true, pagina: 0 }))
    await waitFor(() => expect(result.current.itens).toHaveLength(1))
    await act(async () => { await result.current.alternarSeguir(2) })
    expect(result.current.itens).toHaveLength(0)
  })
  it('falha de rede vira mensagem, não quebra', async () => {
    vi.mocked(fetchFeed).mockRejectedValue(new Error('x'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.erro).toMatch(/Não foi possível carregar o feed/))
  })
})
