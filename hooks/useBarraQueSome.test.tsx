import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useBarraQueSome } from './useBarraQueSome'

afterEach(() => { cleanup(); Object.defineProperty(window, 'scrollY', { value: 0, configurable: true }) })

function rolarPara(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => { window.dispatchEvent(new Event('scroll')) })
}

describe('useBarraQueSome', () => {
  it('começa visível', () => {
    const { result } = renderHook(() => useBarraQueSome())
    expect(result.current.visivel).toBe(true)
  })
  it('perto do topo nunca some, mesmo rolando para baixo', () => {
    const { result } = renderHook(() => useBarraQueSome())
    rolarPara(60)
    expect(result.current.visivel).toBe(true)
  })
  it('some ao rolar para baixo e volta ao rolar para cima', () => {
    const { result } = renderHook(() => useBarraQueSome())
    rolarPara(300)
    expect(result.current.visivel).toBe(false)
    rolarPara(250)
    expect(result.current.visivel).toBe(true)
  })
  it('movimento pequeno não faz a barra piscar', () => {
    const { result } = renderHook(() => useBarraQueSome())
    rolarPara(300)
    expect(result.current.visivel).toBe(false)
    rolarPara(296)
    expect(result.current.visivel).toBe(false)
  })
  it('ao voltar para perto do topo, aparece', () => {
    const { result } = renderHook(() => useBarraQueSome())
    rolarPara(500)
    rolarPara(30)
    expect(result.current.visivel).toBe(true)
  })
  it('mostrar() força a barra a aparecer (foco por teclado)', () => {
    const { result } = renderHook(() => useBarraQueSome())
    rolarPara(400)
    act(() => result.current.mostrar())
    expect(result.current.visivel).toBe(true)
  })
})
