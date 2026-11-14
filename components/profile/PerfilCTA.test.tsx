// components/profile/PerfilCTA.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PerfilCTA from '@/components/profile/PerfilCTA'

describe('PerfilCTA', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      observe() {}
      disconnect() {}
      unobserve() {}
    })
  })

  it('chama no WhatsApp, sem falar em orçamento', () => {
    render(<PerfilCTA nome="João" whatsapp="43999990000" onClique={async () => {}} />)
    const link = screen.getByRole('link', { name: /chamar no whatsapp/i })
    expect(link.getAttribute('href')).toContain('wa.me/')
    expect(document.body.textContent).not.toMatch(/orçamento/i)
  })

  it('registra o clique ao tocar no botão', () => {
    const onClique = vi.fn().mockResolvedValue(undefined)
    render(<PerfilCTA nome="João" whatsapp="43999990000" onClique={onClique} />)
    fireEvent.click(screen.getByRole('link', { name: /chamar no whatsapp/i }))
    expect(onClique).toHaveBeenCalledTimes(1)
  })

  it('não mostra nada sem WhatsApp válido', () => {
    const { container } = render(<PerfilCTA nome="João" whatsapp="" onClique={async () => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
