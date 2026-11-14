// hooks/usePrestadores.test.ts
//
// Regras da lista de resultados: cidade salva como ponto de partida, "Ver outras cidades",
// consulta mais leve quando a cidade é a salva, e a lista nunca esperar pedido de localização.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const parametros = new URLSearchParams()
vi.mock('next/navigation', () => ({ useSearchParams: () => parametros }))

let cidadeSalva: { id: string; nome: string } | null = null
vi.mock('@/lib/contexts/LocationContext', () => ({
  useLocation: () => ({ cidadeAtual: cidadeSalva, estadoLocalizacao: 'parado', solicitarLocalizacao: vi.fn() }),
}))

const getPrestadoresAtivos = vi.fn()
const getMediasAvaliacoes = vi.fn()
vi.mock('@/lib/db/prestadores', () => ({
  getPrestadoresAtivos: (...a: unknown[]) => getPrestadoresAtivos(...a),
  getMediasAvaliacoes: (...a: unknown[]) => getMediasAvaliacoes(...a),
}))
vi.mock('@/lib/db/logs', () => ({ insertLog: vi.fn().mockResolvedValue(undefined) }))

import { limparCacheLista, usePrestadores } from '@/hooks/usePrestadores'

function linha(id: number, cidade: string, extra: Record<string, unknown> = {}) {
  return {
    id, nome: `Prof ${id}`, slug: `prof-${id}`, origem_tipo: 'registro_direto', verificado: false, habilidades: [],
    cidade_id: `c-${cidade}`, categoria_id: 'k1', estado_sigla: 'PR',
    cidades: { id: `c-${cidade}`, nome: cidade, estado_sigla: 'PR', regiao_id: 'r1', regioes: { id: 'r1', nome: 'Norte' } },
    categorias: { id: 'k1', nome: 'Pedreiro', grupo_id: 'g1', categorias_grupos: { id: 'g1', nome: 'Construção' } },
    regioes: { id: 'r1', nome: 'Norte' },
    ...extra,
  }
}

const catalogo = [linha(1, 'Londrina'), linha(2, 'Londrina'), linha(3, 'Maringá')]

function definirUrl(query: Record<string, string>) {
  for (const k of Array.from(parametros.keys())) parametros.delete(k)
  for (const [k, v] of Object.entries(query)) parametros.set(k, v)
}

beforeEach(() => {
  limparCacheLista()
  cidadeSalva = null
  getPrestadoresAtivos.mockReset()
  getMediasAvaliacoes.mockReset()
  getMediasAvaliacoes.mockResolvedValue({ data: [], error: null })
  getPrestadoresAtivos.mockImplementation(async (cidadeId?: string) => ({
    data: cidadeId ? catalogo.filter(p => p.cidade_id === cidadeId) : catalogo,
    error: null,
  }))
})

describe('usePrestadores — cidade', () => {
  it('sem cidade salva carrega o catálogo todo, sem esperar permissão de localização', async () => {
    definirUrl({ q: 'pedreiro' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(getPrestadoresAtivos).toHaveBeenCalledWith(undefined)
    expect(result.current.prestadoresExibidos).toHaveLength(3)
    expect(result.current.cidadeNome).toBeNull()
  })

  it('com cidade salva, consulta só a cidade dela e diz de onde veio', async () => {
    cidadeSalva = { id: 'c-Londrina', nome: 'Londrina' }
    definirUrl({ q: 'pedreiro' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(getPrestadoresAtivos).toHaveBeenCalledWith('c-Londrina')
    expect(result.current.prestadoresExibidos.map(p => p.id)).toEqual([1, 2])
    expect(result.current.cidadeNome).toBe('Londrina')
    expect(result.current.origemCidade).toBe('salva')
  })

  it('vindo da home (cidade na URL igual à salva) também consulta só a cidade', async () => {
    cidadeSalva = { id: 'c-Londrina', nome: 'Londrina' }
    definirUrl({ q: 'pedreiro', cidade: 'Londrina' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(getPrestadoresAtivos).toHaveBeenCalledWith('c-Londrina')
    expect(result.current.origemCidade).toBe('filtro')
  })

  it('"Ver outras cidades" (ampliar) mostra o catálogo todo mesmo com cidade salva', async () => {
    cidadeSalva = { id: 'c-Londrina', nome: 'Londrina' }
    definirUrl({ q: 'pedreiro', ampliar: '1' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(getPrestadoresAtivos).toHaveBeenCalledWith(undefined)
    expect(result.current.prestadoresExibidos).toHaveLength(3)
    expect(result.current.cidadeNome).toBeNull()
  })

  it('cidade escrita na busca vale mais que a salva', async () => {
    cidadeSalva = { id: 'c-Londrina', nome: 'Londrina' }
    definirUrl({ q: 'pedreiro em Maringá' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prestadoresExibidos.map(p => p.id)).toEqual([3])
    expect(result.current.origemCidade).toBe('texto')
  })

  it('as contagens dos filtros acompanham a cidade em vigor', async () => {
    definirUrl({ q: 'pedreiro', cidade: 'Londrina' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prestadoresExibidos).toHaveLength(2)
    expect(result.current.gruposDisponiveis).toEqual([{ id: 'g1', nome: 'Construção', count: 2 }])
  })
})

describe('usePrestadores — falha e nova tentativa', () => {
  it('mostra erro e consegue tentar de novo', async () => {
    definirUrl({ q: 'pedreiro' })
    getPrestadoresAtivos.mockResolvedValueOnce({ data: null, error: new Error('rede') })
    const erroConsole = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.erro).toBe(true))

    result.current.recarregar()
    await waitFor(() => expect(result.current.erro).toBe(false))
    await waitFor(() => expect(result.current.prestadoresExibidos).toHaveLength(3))
    erroConsole.mockRestore()
  })
})
