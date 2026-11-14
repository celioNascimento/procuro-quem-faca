// components/home/SearchForm.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchForm from '@/components/home/SearchForm'

function montar(temErro = false, onSubmit = vi.fn()) {
  render(<SearchForm busca="" setBusca={() => {}} onSubmit={onSubmit} temErro={temErro} />)
  return onSubmit
}

function simularPonteiro(fino: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: fino && q.includes('fine'), media: q, addEventListener() {}, removeEventListener() {} }))
}

afterEach(() => vi.unstubAllGlobals())

describe('SearchForm', () => {
  it('no celular (toque) não tira o foco da página: sem teclado aberto de cara', () => {
    simularPonteiro(false)
    montar()
    expect(document.activeElement).not.toBe(screen.getByRole('textbox', { name: /o que você procura/i }))
  })

  it('no computador (mouse) o campo já vem focado', () => {
    simularPonteiro(true)
    montar()
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /o que você procura/i }))
  })

  it('o campo tem nome, teclado de busca e placeholder fixo', () => {
    simularPonteiro(false)
    montar()
    const campo = screen.getByRole('textbox', { name: /o que você procura/i })
    expect(campo.getAttribute('enterkeyhint')).toBe('search')
    expect(campo.getAttribute('placeholder')).toBe('Ex: pedreiro em Londrina')
  })

  it('o erro é anunciado como alerta e liga ao campo, sem trocar o placeholder', () => {
    simularPonteiro(false)
    montar(true)
    const alerta = screen.getByRole('alert')
    expect(alerta.textContent).toMatch(/digite o que você procura/i)
    const campo = screen.getByRole('textbox', { name: /o que você procura/i })
    expect(campo.getAttribute('aria-describedby')).toBe(alerta.id)
    expect(campo.getAttribute('aria-invalid')).toBe('true')
    expect(campo.getAttribute('placeholder')).toBe('Ex: pedreiro em Londrina')
  })

  it('sem erro não há alerta', () => {
    simularPonteiro(false)
    montar(false)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('enviar chama onSubmit com o texto digitado', () => {
    simularPonteiro(false)
    const onSubmit = montar()
    const campo = screen.getByRole('textbox', { name: /o que você procura/i }) as HTMLInputElement
    campo.value = 'pedreiro'
    fireEvent.submit(campo.closest('form')!)
    expect(onSubmit.mock.calls[0][1]).toBe('pedreiro')
  })
})
