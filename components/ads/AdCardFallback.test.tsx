import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdCardFallback } from './AdCardFallback'

const fallback = { emoji: '🚀', titulo: 'Seu negócio visto por quem precisa', subtitulo: 'Anuncie no Procuro Quem Faça.', cta: 'Ver planos de anúncio', href: () => '/x', cor: '' }

describe('AdCardFallback', () => {
  it('versão normal mostra título, subtítulo e botão', () => {
    render(<AdCardFallback fallback={fallback} />)
    expect(screen.getByText('Anuncie no Procuro Quem Faça.')).toBeTruthy()
    expect(screen.getByText(/ver planos de anúncio/i)).toBeTruthy()
  })

  it('faixa fina (topo da lista) mostra só rótulo, título e chamada, sem subtítulo', () => {
    render(<AdCardFallback fallback={fallback} compacto />)
    expect(screen.getByText('Anúncio')).toBeTruthy()
    expect(screen.getByText('Seu negócio visto por quem precisa')).toBeTruthy()
    expect(screen.queryByText('Anuncie no Procuro Quem Faça.')).toBeNull()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/x')
  })
})
