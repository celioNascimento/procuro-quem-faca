// components/Footer.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

describe('Footer', () => {
  it('mostra o nome da plataforma e o ano', () => {
    render(<Footer />)
    expect(screen.getByText('Procuro Quem Faça')).toBeTruthy()
    expect(document.body.textContent).toContain(String(new Date().getFullYear()))
  })

  it('não traz assinatura de desenvolvedor', () => {
    render(<Footer />)
    expect(document.body.textContent).not.toMatch(/desenvolvido por/i)
    expect(document.body.textContent).not.toMatch(/CRR Nascimento/i)
  })

  it('mantém os links institucionais', () => {
    render(<Footer />)
    for (const nome of ['Privacidade', 'Termos', 'Quem somos']) {
      expect(screen.getByText(new RegExp(nome, 'i'))).toBeTruthy()
    }
  })
})
