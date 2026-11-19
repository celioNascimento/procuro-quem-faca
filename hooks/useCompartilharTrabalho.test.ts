import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('@/lib/services/compartilharPerfil.service', () => ({
  buildUrlPerfil: (slug: string) => `https://pqf.test/${slug}`,
  compartilharViaNative: vi.fn(),
  registrarCompartilhamento: vi.fn().mockResolvedValue(undefined),
}))
import { compartilharViaNative, registrarCompartilhamento } from '@/lib/services/compartilharPerfil.service'
import { MENSAGEM_ERRO_COMPARTILHAR, MENSAGEM_LINK_COPIADO, useCompartilharTrabalho } from './useCompartilharTrabalho'
import type { FeedItem } from '@/lib/feed/feed'

const item: FeedItem = {
  projetoId: 'a', titulo: 'Reforma de varanda', descricao: '', concluidoEm: null,
  prestador: { id: 2, nome: 'Pedro Pedreiro', slug: 'pedro', categoria: null, cidade: null },
  fotos: ['https://x/1.jpg'], totalCurtidas: 0, curtidoPorMim: false, seguindo: false, meu: false,
}

beforeEach(() => { vi.useFakeTimers(); vi.mocked(compartilharViaNative).mockReset(); vi.mocked(registrarCompartilhamento).mockClear() })
afterEach(() => { vi.useRealTimers() })

describe('useCompartilharTrabalho', () => {
  it('envia título, texto citando o trabalho e o link do perfil', async () => {
    vi.mocked(compartilharViaNative).mockResolvedValue('native')
    const { result } = renderHook(() => useCompartilharTrabalho())
    await act(async () => { await result.current.compartilhar(item) })
    expect(compartilharViaNative).toHaveBeenCalledWith('Reforma de varanda', 'Veja "Reforma de varanda", trabalho de Pedro Pedreiro no Procuro Quem Faça.', 'https://pqf.test/pedro?projeto=a')
  })
  it('menu nativo: registra o canal e não mostra aviso', async () => {
    vi.mocked(compartilharViaNative).mockResolvedValue('native')
    const { result } = renderHook(() => useCompartilharTrabalho())
    await act(async () => { await result.current.compartilhar(item) })
    expect(registrarCompartilhamento).toHaveBeenCalledWith({ prestador_id: 2, canal: 'native_share', origem: 'feed' })
    expect(result.current.confirmacao).toBeNull()
    expect(result.current.erro).toBeNull()
  })
  it('computador: copia o link, avisa e o aviso some sozinho', async () => {
    vi.mocked(compartilharViaNative).mockResolvedValue('clipboard')
    const { result } = renderHook(() => useCompartilharTrabalho())
    await act(async () => { await result.current.compartilhar(item) })
    expect(result.current.confirmacao).toBe(MENSAGEM_LINK_COPIADO)
    expect(registrarCompartilhamento).toHaveBeenCalledWith({ prestador_id: 2, canal: 'clipboard', origem: 'feed' })
    act(() => { vi.advanceTimersByTime(4100) })
    expect(result.current.confirmacao).toBeNull()
  })
  it('falha: mostra o erro em frase simples e não registra', async () => {
    vi.mocked(compartilharViaNative).mockResolvedValue('erro')
    const { result } = renderHook(() => useCompartilharTrabalho())
    await act(async () => { await result.current.compartilhar(item) })
    expect(result.current.erro).toBe(MENSAGEM_ERRO_COMPARTILHAR)
    expect(registrarCompartilhamento).not.toHaveBeenCalled()
  })
  it('um novo compartilhamento limpa o erro anterior', async () => {
    vi.mocked(compartilharViaNative).mockResolvedValueOnce('erro').mockResolvedValueOnce('native')
    const { result } = renderHook(() => useCompartilharTrabalho())
    await act(async () => { await result.current.compartilhar(item) })
    await act(async () => { await result.current.compartilhar(item) })
    expect(result.current.erro).toBeNull()
  })
  it('copiarLink: copia o link do trabalho, avisa e registra, sem abrir o menu de compartilhar', async () => {
    const escrever = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escrever }, configurable: true })
    const { result } = renderHook(() => useCompartilharTrabalho())
    await act(async () => { await result.current.copiarLink(item) })
    expect(escrever).toHaveBeenCalledWith('https://pqf.test/pedro?projeto=a')
    expect(compartilharViaNative).not.toHaveBeenCalled()
    expect(result.current.confirmacao).toBe(MENSAGEM_LINK_COPIADO)
    expect(registrarCompartilhamento).toHaveBeenCalledWith({ prestador_id: 2, canal: 'clipboard', origem: 'feed' })
  })
  it('copiarLink: se o navegador recusar, mostra o erro e não confirma', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('x')) }, configurable: true })
    const { result } = renderHook(() => useCompartilharTrabalho())
    await act(async () => { await result.current.copiarLink(item) })
    expect(result.current.erro).toBe(MENSAGEM_ERRO_COMPARTILHAR)
    expect(result.current.confirmacao).toBeNull()
    expect(registrarCompartilhamento).not.toHaveBeenCalled()
  })
})
