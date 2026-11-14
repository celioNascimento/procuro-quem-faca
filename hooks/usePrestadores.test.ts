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
    categorias: { id: 'k1', nome: 'Pedreiro', grupo_id: 'g1', categorias_grupos: { id: 'g1', nome: 'Construção', icone: 'hammer' } },
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
    expect(result.current.prestadoresExibidos[0].grupo_icone).toBe('hammer')
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

describe('usePrestadores — cidade por id', () => {
  it('?cidade=<id> filtra por essa cidade, mostra o nome e marca a opção do menu', async () => {
    definirUrl({ q: 'pedreiro', cidade: 'c-Maringá' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prestadoresExibidos.map(p => p.id)).toEqual([3])
    expect(result.current.cidadeNome).toBe('Maringá')
    expect(result.current.cidadeFiltroId).toBe('c-Maringá')
    expect(result.current.cidadesDisponiveis.map(c => c.id)).toContain('c-Londrina')
  })

  it('home com o id da cidade salva consulta só a cidade dela', async () => {
    cidadeSalva = { id: 'c-Londrina', nome: 'Londrina' }
    definirUrl({ q: 'pedreiro', cidade: 'c-Londrina' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(getPrestadoresAtivos).toHaveBeenCalledWith('c-Londrina')
    expect(result.current.cidadeNome).toBe('Londrina')
  })

  it('link antigo com o NOME da cidade continua funcionando', async () => {
    definirUrl({ q: 'pedreiro', cidade: 'Maringá' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prestadoresExibidos.map(p => p.id)).toEqual([3])
    expect(result.current.cidadeFiltroId).toBe('c-Maringá')
  })

  it('duas cidades com o mesmo nome não se misturam (cidade salva usa o id)', async () => {
    const duas = [
      linha(1, 'Santa Helena', { cidade_id: 'pr', cidades: { id: 'pr', nome: 'Santa Helena', estado_sigla: 'PR', regiao_id: 'r1', regioes: { id: 'r1', nome: 'Norte' } } }),
      linha(2, 'Santa Helena', { cidade_id: 'sc', estado_sigla: 'SC', cidades: { id: 'sc', nome: 'Santa Helena', estado_sigla: 'SC', regiao_id: 'r9', regioes: { id: 'r9', nome: 'Sul' } } }),
    ]
    getPrestadoresAtivos.mockImplementation(async (cidadeId?: string) => ({
      data: cidadeId ? duas.filter(p => p.cidade_id === cidadeId) : duas, error: null,
    }))
    definirUrl({ q: 'pedreiro', ampliar: '1' })
    const { result, rerender } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.cidadesDisponiveis.map(c => c.nome).sort()).toEqual(['Santa Helena - PR', 'Santa Helena - SC'])

    definirUrl({ q: 'pedreiro', cidade: 'sc' })
    rerender()
    await waitFor(() => expect(result.current.prestadoresExibidos.map(p => p.id)).toEqual([2]))
  })
})

describe('usePrestadores — vitrine', () => {
  const vitrinePedreiro = linha(10, 'Londrina', { origem_tipo: 'vitrine' })
  const vitrineEletricista = linha(11, 'Londrina', {
    origem_tipo: 'vitrine', nome: 'Luz & Cia',
    categorias: { id: 'k2', nome: 'Eletricista', grupo_id: 'g1', categorias_grupos: { id: 'g1', nome: 'Construção' } },
  })

  beforeEach(() => {
    getPrestadoresAtivos.mockImplementation(async () => ({
      data: [linha(1, 'Londrina'), vitrineEletricista, vitrinePedreiro], error: null,
    }))
  })

  it('a vitrine que combina com o termo fica no topo; a que não combina some', async () => {
    definirUrl({ q: 'pedreiro' })
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prestadoresExibidos.map(p => p.id)).toEqual([10, 1])
  })

  it('sem termo, todas as vitrines aparecem, antes dos demais', async () => {
    definirUrl({})
    const { result } = renderHook(() => usePrestadores())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.prestadoresExibidos.map(p => p.id)).toEqual([11, 10, 1])
  })
})
