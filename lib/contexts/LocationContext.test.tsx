// lib/contexts/LocationContext.test.tsx
//
// A localização do aparelho só é pedida quando a pessoa toca no botão — nunca ao abrir a página —
// e a página não recarrega sozinha depois.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const descobrirCidade = vi.fn()
vi.mock('@/lib/localizacao', () => ({ descobrirCidade: (...a: unknown[]) => descobrirCidade(...a) }))

import { LocationProvider, useLocation } from '@/lib/contexts/LocationContext'

const wrapper = ({ children }: { children: ReactNode }) => <LocationProvider>{children}</LocationProvider>

const getCurrentPosition = vi.fn()

beforeEach(() => {
  descobrirCidade.mockReset()
  getCurrentPosition.mockReset()
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
  document.cookie = 'pqf_cidade=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation')
})

describe('LocationProvider', () => {
  it('não pede a localização ao montar', () => {
    const { result } = renderHook(() => useLocation(), { wrapper })
    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(result.current.cidadeAtual).toBeNull()
    expect(result.current.estadoLocalizacao).toBe('parado')
  })

  it('lê a cidade salva no cookie', () => {
    document.cookie = `pqf_cidade=${encodeURIComponent(JSON.stringify({ id: 'c1', nome: 'Londrina' }))}; path=/`
    const { result } = renderHook(() => useLocation(), { wrapper })
    expect(result.current.cidadeAtual).toEqual({ id: 'c1', nome: 'Londrina' })
  })

  it('ao permitir, descobre e guarda só a cidade (cookie), sem recarregar a página', async () => {
    getCurrentPosition.mockImplementation((ok: (p: unknown) => void) => ok({ coords: { latitude: -23.3, longitude: -51.1 } }))
    descobrirCidade.mockResolvedValue({ id: 'c1', nome: 'Londrina' })

    const { result } = renderHook(() => useLocation(), { wrapper })
    act(() => result.current.solicitarLocalizacao())

    await waitFor(() => expect(result.current.cidadeAtual).toEqual({ id: 'c1', nome: 'Londrina' }))
    expect(result.current.estadoLocalizacao).toBe('parado')
    expect(document.cookie).toContain('pqf_cidade=')
    expect(document.cookie).not.toMatch(/-23\.3|-51\.1/)
  })

  it('negado: avisa e não guarda nada', async () => {
    getCurrentPosition.mockImplementation((_ok: unknown, erro: (e: { code: number }) => void) => erro({ code: 1 }))
    const { result } = renderHook(() => useLocation(), { wrapper })
    act(() => result.current.solicitarLocalizacao())
    await waitFor(() => expect(result.current.estadoLocalizacao).toBe('negado'))
    expect(result.current.cidadeAtual).toBeNull()
  })

  it('permitiu mas não há cidade atendida: sem_cidade', async () => {
    getCurrentPosition.mockImplementation((ok: (p: unknown) => void) => ok({ coords: { latitude: 0, longitude: 0 } }))
    descobrirCidade.mockResolvedValue(null)
    const { result } = renderHook(() => useLocation(), { wrapper })
    act(() => result.current.solicitarLocalizacao())
    await waitFor(() => expect(result.current.estadoLocalizacao).toBe('sem_cidade'))
  })

  it('falha técnica (tempo esgotado / sem rede): erro, para tentar de novo', async () => {
    getCurrentPosition.mockImplementation((_ok: unknown, erro: (e: { code: number }) => void) => erro({ code: 3 }))
    const { result } = renderHook(() => useLocation(), { wrapper })
    act(() => result.current.solicitarLocalizacao())
    await waitFor(() => expect(result.current.estadoLocalizacao).toBe('erro'))
  })

  it('aparelho sem localização: indisponivel', () => {
    Reflect.deleteProperty(navigator, 'geolocation')
    const { result } = renderHook(() => useLocation(), { wrapper })
    act(() => result.current.solicitarLocalizacao())
    expect(result.current.estadoLocalizacao).toBe('indisponivel')
  })
})
