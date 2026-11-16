// hooks/useFiltrosPrestadores.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const replace = vi.fn()
const parametros = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => parametros,
}))

vi.mock('@/lib/cidadesCatalogo', () => ({
  carregarCatalogoCidades: async () => [
    { id: 'c-Londrina', nome: 'Londrina', estado_sigla: 'PR' },
    { id: 'c-Maringa', nome: 'Maringá', estado_sigla: 'PR' },
  ],
}))

import { useFiltrosPrestadores } from '@/hooks/useFiltrosPrestadores'

function abrir(query: string) {
  window.history.replaceState(null, '', `/prestadores?${query}`)
  for (const k of Array.from(parametros.keys())) parametros.delete(k)
  new URLSearchParams(query).forEach((v, k) => parametros.set(k, v))
}

function ultimaUrl() {
  const [url] = replace.mock.calls.at(-1) as [string]
  return new URL(url, 'http://x')
}

beforeEach(() => replace.mockClear())

describe('useFiltrosPrestadores — Ver outras cidades', () => {
  it('com a cidade escrita na busca, tira "em Maringá" do texto e amplia', async () => {
    abrir('q=pedreiro%20em%20Maringa')
    const { result } = renderHook(() => useFiltrosPrestadores())
    await act(async () => { await result.current.verOutrasCidades() })
    const u = ultimaUrl()
    expect(u.searchParams.get('q')).toBe('pedreiro')
    expect(u.searchParams.get('ampliar')).toBe('1')
  })

  it('com a cidade vinda do filtro, tira ?cidade e amplia, sem mexer no texto', async () => {
    abrir('q=pedreiro&cidade=abc')
    const { result } = renderHook(() => useFiltrosPrestadores())
    await act(async () => { await result.current.verOutrasCidades() })
    const u = ultimaUrl()
    expect(u.searchParams.get('q')).toBe('pedreiro')
    expect(u.searchParams.has('cidade')).toBe(false)
    expect(u.searchParams.get('ampliar')).toBe('1')
  })

  it('link antigo com ?profissao= também perde a cidade do texto', async () => {
    abrir('profissao=pedreiro%20em%20Maringa')
    const { result } = renderHook(() => useFiltrosPrestadores())
    await act(async () => { await result.current.verOutrasCidades() })
    const u = ultimaUrl()
    expect(u.searchParams.get('q')).toBe('pedreiro')
    expect(u.searchParams.has('profissao')).toBe(false)
  })
})
