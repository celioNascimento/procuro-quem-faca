import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SessaoFotos } from '@/components/profile/SessaoFotos'

afterEach(cleanup)

describe('SessaoFotos', () => {
  it('centraliza as miniaturas sem cortar o começo da faixa quando ela rola', () => {
    render(<SessaoFotos sessao={{ titulo: 'Fotos do profissional', fotos: ['/a.jpg', '/b.jpg', '/c.jpg'] }} />)

    const faixa = screen.getByTestId('miniaturas-fotos')
    expect(faixa.parentElement?.className).toContain('justify-center')
    expect(faixa.className).toContain('overflow-x-auto')
    expect(faixa.className).not.toContain('justify-center')
  })

  it('a foto principal preenche toda a moldura, sem faixas nem respiro ao redor', () => {
    render(<SessaoFotos sessao={{ titulo: 'Fotos do profissional', fotos: ['/a.jpg', '/b.jpg'] }} />)

    const foto = screen.getByAltText('Fotos do profissional — foto 1')
    expect(foto.className).toContain('object-cover')
    expect(foto.className).not.toContain('object-contain')
    expect(foto.className).not.toMatch(/(^|\s)(sm:)?p-\d/)
  })
})
