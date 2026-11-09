// lib/navegacao.test.ts
//
// Regras do "voltar": só desfaz o histórico quando existe página anterior do app;
// senão usa o fallback. E `from` nunca pode apontar para fora do site.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { podeVoltarNoApp, sanitizarRotaInterna, voltarOuIr } from '@/lib/navegacao'

function roteador() {
  return { back: vi.fn(), push: vi.fn(), replace: vi.fn() }
}

function simularNavigationApi(canGoBack: boolean) {
  Object.defineProperty(window, 'navigation', { value: { canGoBack }, configurable: true })
}

afterEach(() => {
  Reflect.deleteProperty(window, 'navigation')
})

describe('sanitizarRotaInterna', () => {
  it('mantém caminhos internos, com query', () => {
    expect(sanitizarRotaInterna('/prestadores?q=pedreiro%20a')).toBe('/prestadores?q=pedreiro%20a')
  })

  it.each(['//evil.com', 'https://evil.com', '/\\evil.com', '', null, undefined])(
    'rejeita %j e devolve o fallback',
    (valor) => {
      expect(sanitizarRotaInterna(valor)).toBe('/prestadores')
    },
  )
})

describe('voltarOuIr', () => {
  it('com página anterior do app: volta no histórico, sem criar entrada nova', () => {
    simularNavigationApi(true)
    const r = roteador()

    voltarOuIr(r, '/prestadores')

    expect(r.back).toHaveBeenCalledOnce()
    expect(r.push).not.toHaveBeenCalled()
    expect(r.replace).not.toHaveBeenCalled()
  })

  it('sem página anterior (link aberto direto): substitui pelo fallback', () => {
    simularNavigationApi(false)
    const r = roteador()

    voltarOuIr(r, '/prestadores?q=pedreiro')

    expect(r.replace).toHaveBeenCalledWith('/prestadores?q=pedreiro')
    expect(r.back).not.toHaveBeenCalled()
  })
})

describe('podeVoltarNoApp', () => {
  it('segue o Navigation API quando disponível', () => {
    simularNavigationApi(true)
    expect(podeVoltarNoApp()).toBe(true)
    simularNavigationApi(false)
    expect(podeVoltarNoApp()).toBe(false)
  })
})
