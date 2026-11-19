import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('@/lib/services/feed.service', () => ({
  fetchFeed: vi.fn(), alternarCurtida: vi.fn(), alternarSalvo: vi.fn(), seguirPrestador: vi.fn(), deixarDeSeguirPrestador: vi.fn(),
}))
import { alternarCurtida, alternarSalvo, deixarDeSeguirPrestador, fetchFeed, seguirPrestador } from '@/lib/services/feed.service'
import { useFeed } from './useFeed'
import type { FeedItem } from '@/lib/feed/feed'
import type { FiltrosFeed } from '@/lib/feed/filtros'

const item = (id: string, prestadorId = 2): FeedItem => ({
  projetoId: id, titulo: 'T', descricao: '', concluidoEm: null,
  prestador: { id: prestadorId, nome: 'P', slug: 'p' + prestadorId, categoria: null, cidade: null },
  fotos: ['https://x/1.jpg'], totalCurtidas: 1, curtidoPorMim: false, seguindo: false, salvoPorMim: false, meu: false,
})

beforeEach(() => { vi.mocked(fetchFeed).mockReset().mockResolvedValue([item('a'), item('b', 9)]) })

describe('useFeed', () => {
  it('carrega o feed e some o carregando', async () => {
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    expect(result.current.carregando).toBe(false)
    expect(fetchFeed).toHaveBeenCalledWith({ categoriaId: null, cidadeId: null, estado: null, somenteSeguidos: false, somenteSalvos: false, pagina: 0 })
  })
  it('os filtros de tipo de serviço, estado e cidade vão para a busca e recarregam quando mudam', async () => {
    const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222'
    const { result, rerender } = renderHook(({ f }) => useFeed(true, f), { initialProps: { f: { categoriaId: A, cidadeId: B, estado: 'PR' } as FiltrosFeed } })
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    expect(fetchFeed).toHaveBeenLastCalledWith({ categoriaId: A, cidadeId: B, estado: 'PR', somenteSeguidos: false, somenteSalvos: false, pagina: 0 })
    rerender({ f: { categoriaId: A, cidadeId: null, estado: null } })
    await waitFor(() => expect(fetchFeed).toHaveBeenLastCalledWith({ categoriaId: A, cidadeId: null, estado: null, somenteSeguidos: false, somenteSalvos: false, pagina: 0 }))
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
    await waitFor(() => expect(fetchFeed).toHaveBeenLastCalledWith({ categoriaId: null, cidadeId: null, estado: null, somenteSeguidos: true, somenteSalvos: false, pagina: 0 }))
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
  it('visitante: salvar só avisa, sem chamar o banco', async () => {
    const { result } = renderHook(() => useFeed(false))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.aviso).toMatch(/Entre na sua conta/)
    expect(alternarSalvo).not.toHaveBeenCalled()
  })
  it('salvar logado marca o trabalho; salvar de novo remove', async () => {
    vi.mocked(alternarSalvo).mockResolvedValueOnce({ salvo: true }).mockResolvedValueOnce({ salvo: false })
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.salvar('a') })
    expect(alternarSalvo).toHaveBeenCalledWith('a')
    expect(result.current.itens.map(i => i.salvoPorMim)).toEqual([true, false])
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.itens.map(i => i.salvoPorMim)).toEqual([false, false])
  })
  it('erro ao salvar desfaz a marca e avisa (limite de 500)', async () => {
    vi.mocked(alternarSalvo).mockResolvedValue({ erro: 'limite_salvos' })
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.itens[0].salvoPorMim).toBe(false)
    expect(result.current.aviso).toMatch(/limite de 500 trabalhos salvos/)
  })
  it('falha de rede ao salvar desfaz a marca', async () => {
    vi.mocked(alternarSalvo).mockRejectedValue(new Error('rede'))
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(2))
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.itens[0].salvoPorMim).toBe(false)
    expect(result.current.aviso).toBe('rede')
  })
  it('a aba Salvos pede só os salvos e remover dos salvos tira o trabalho da lista', async () => {
    vi.mocked(fetchFeed).mockResolvedValue([{ ...item('a'), salvoPorMim: true }])
    vi.mocked(alternarSalvo).mockResolvedValue({ salvo: false })
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(1))
    act(() => result.current.setAba('salvos'))
    await waitFor(() => expect(fetchFeed).toHaveBeenLastCalledWith({ categoriaId: null, cidadeId: null, estado: null, somenteSeguidos: false, somenteSalvos: true, pagina: 0 }))
    await waitFor(() => expect(result.current.itens).toHaveLength(1))
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.itens).toHaveLength(0)
  })
  it('fora da aba Salvos, remover dos salvos mantém o trabalho na lista', async () => {
    vi.mocked(fetchFeed).mockResolvedValue([{ ...item('a'), salvoPorMim: true }])
    vi.mocked(alternarSalvo).mockResolvedValue({ salvo: false })
    const { result } = renderHook(() => useFeed(true))
    await waitFor(() => expect(result.current.itens).toHaveLength(1))
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.itens).toHaveLength(1)
    expect(result.current.itens[0].salvoPorMim).toBe(false)
  })
})
