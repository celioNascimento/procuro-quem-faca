import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const sessao = vi.hoisted(() => ({ valor: null as unknown }))
vi.mock('@/hooks/useSession', () => ({ useSession: () => sessao.valor }))
vi.mock('@/lib/services/feed.service', () => ({
  fetchPerfilSocial: vi.fn(), alternarCurtida: vi.fn(), alternarSalvo: vi.fn(), seguirPrestador: vi.fn(), deixarDeSeguirPrestador: vi.fn(),
}))
import { alternarCurtida, alternarSalvo, deixarDeSeguirPrestador, fetchPerfilSocial, seguirPrestador } from '@/lib/services/feed.service'
import { usePerfilSocial } from './usePerfilSocial'

const social = { totalSeguidores: 3, seguindo: false, meuPerfil: false, curtidas: { a: { total: 2, curtidoPorMim: false, salvoPorMim: false } } }

beforeEach(() => {
  sessao.valor = { user: { id: 'u' } }
  vi.mocked(fetchPerfilSocial).mockReset().mockResolvedValue(social)
  vi.mocked(seguirPrestador).mockReset()
  vi.mocked(deixarDeSeguirPrestador).mockReset()
  vi.mocked(alternarCurtida).mockReset()
  vi.mocked(alternarSalvo).mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

async function abrir() {
  const h = renderHook(() => usePerfilSocial(7))
  await waitFor(() => expect(h.result.current.social).not.toBeNull())
  return h
}

describe('usePerfilSocial', () => {
  it('carrega os totais do perfil', async () => {
    const { result } = await abrir()
    expect(fetchPerfilSocial).toHaveBeenCalledWith(7)
    expect(result.current.social?.totalSeguidores).toBe(3)
  })
  it('perfil sem curtir/seguir (banco devolve null) fica sem dados', async () => {
    vi.mocked(fetchPerfilSocial).mockResolvedValue(null)
    const { result } = renderHook(() => usePerfilSocial(7))
    await waitFor(() => expect(fetchPerfilSocial).toHaveBeenCalled())
    expect(result.current.social).toBeNull()
  })
  it('visitante: seguir e curtir só avisam, sem chamar o banco', async () => {
    sessao.valor = null
    const { result } = await abrir()
    await act(async () => { await result.current.seguir() })
    expect(result.current.aviso).toMatch(/Entre na sua conta/)
    await act(async () => { await result.current.curtir('a') })
    expect(seguirPrestador).not.toHaveBeenCalled()
    expect(alternarCurtida).not.toHaveBeenCalled()
    expect(result.current.social?.totalSeguidores).toBe(3)
  })
  it('seguir logado soma 1; deixar de seguir tira 1', async () => {
    vi.mocked(seguirPrestador).mockResolvedValue('ok')
    vi.mocked(deixarDeSeguirPrestador).mockResolvedValue('ok')
    const { result } = await abrir()
    await act(async () => { await result.current.seguir() })
    expect(seguirPrestador).toHaveBeenCalledWith(7)
    expect(result.current.social).toMatchObject({ seguindo: true, totalSeguidores: 4 })
    await act(async () => { await result.current.seguir() })
    expect(deixarDeSeguirPrestador).toHaveBeenCalledWith(7)
    expect(result.current.social).toMatchObject({ seguindo: false, totalSeguidores: 3 })
  })
  it('erro ao seguir volta ao estado anterior e explica', async () => {
    vi.mocked(seguirPrestador).mockResolvedValue('limite_atingido')
    const { result } = await abrir()
    await act(async () => { await result.current.seguir() })
    expect(result.current.social).toMatchObject({ seguindo: false, totalSeguidores: 3 })
    expect(result.current.aviso).toMatch(/limite de 500/)
  })
  it('curtir logado usa o total do banco', async () => {
    vi.mocked(alternarCurtida).mockResolvedValue({ curtido: true, total: 9 })
    const { result } = await abrir()
    await act(async () => { await result.current.curtir('a') })
    expect(result.current.social?.curtidas.a).toEqual({ total: 9, curtidoPorMim: true, salvoPorMim: false })
  })
  it('erro ao curtir volta e avisa; falha de rede também', async () => {
    vi.mocked(alternarCurtida).mockResolvedValueOnce({ erro: 'proprio_projeto' })
    const { result } = await abrir()
    await act(async () => { await result.current.curtir('a') })
    expect(result.current.social?.curtidas.a).toEqual({ total: 2, curtidoPorMim: false, salvoPorMim: false })
    expect(result.current.aviso).toMatch(/próprio trabalho/)
    vi.mocked(alternarCurtida).mockRejectedValueOnce(new Error('rede'))
    await act(async () => { await result.current.curtir('a') })
    expect(result.current.social?.curtidas.a).toEqual({ total: 2, curtidoPorMim: false, salvoPorMim: false })
    expect(result.current.aviso).toBeTruthy()
  })
  it('visitante: salvar só avisa, sem chamar o banco', async () => {
    sessao.valor = null
    const { result } = await abrir()
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.aviso).toMatch(/Entre na sua conta/)
    expect(alternarSalvo).not.toHaveBeenCalled()
  })
  it('salvar logado marca na hora e confirma com o banco; salvar de novo desmarca', async () => {
    vi.mocked(alternarSalvo).mockResolvedValueOnce({ salvo: true }).mockResolvedValueOnce({ salvo: false })
    const { result } = await abrir()
    await act(async () => { await result.current.salvar('a') })
    expect(alternarSalvo).toHaveBeenCalledWith('a')
    expect(result.current.social?.curtidas.a.salvoPorMim).toBe(true)
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.social?.curtidas.a.salvoPorMim).toBe(false)
  })
  it('salvar com erro volta ao estado anterior e avisa em frase simples', async () => {
    vi.mocked(alternarSalvo).mockResolvedValue({ erro: 'limite_salvos' })
    const { result } = await abrir()
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.social?.curtidas.a.salvoPorMim).toBe(false)
    expect(result.current.aviso).toBe('Você chegou ao limite de 500 trabalhos salvos. Remova algum para continuar.')
  })
  it('salvar com falha de rede volta ao estado anterior', async () => {
    vi.mocked(alternarSalvo).mockRejectedValue(new Error('rede'))
    const { result } = await abrir()
    await act(async () => { await result.current.salvar('a') })
    expect(result.current.social?.curtidas.a.salvoPorMim).toBe(false)
    expect(result.current.aviso).toBe('rede')
  })
})
