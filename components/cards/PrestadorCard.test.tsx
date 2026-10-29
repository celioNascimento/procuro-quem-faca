// components/cards/PrestadorCard.test.tsx
//
// Estrutura e comportamento do card da lista de busca: link principal do perfil,
// link de reivindicação ("Este perfil é seu?") só nos perfis públicos, e a garantia
// de que um não fica dentro do outro (link dentro de link é HTML inválido e quebrava
// o foco do teclado e os leitores de tela).

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { Prestador } from '@/types/prestador'

// Link simples: não navega de verdade, só repassa o clique ao onClick do card.
vi.mock('next/link', () => ({
  default: ({ href, onClick, children, ...resto }: ComponentProps<'a'> & { href: string }) => (
    <a
      {...resto}
      href={href}
      onClick={(e) => {
        onClick?.(e)
        e.preventDefault()
      }}
    >
      {children}
    </a>
  ),
}))

import PrestadorCard from '@/components/cards/PrestadorCard'
import { getPerfilHref } from '@/lib/prestadorUtils'

function prestador(extra: Partial<Prestador> = {}): Prestador {
  return {
    id: 7,
    nome: 'Antonio Landim Reformas',
    slug: 'antonio-landim-reformas',
    categoria: 'Pedreiro',
    foto_perfil: null,
    bairro: null,
    cidades: { nome: 'Londrina', estado_sigla: 'PR' },
    habilidades: [],
    origem_tipo: 'curadoria_publica',
    ...extra,
  } as Prestador
}

afterEach(cleanup)

describe('PrestadorCard', () => {
  it('o link principal tem o nome do prestador para leitores de tela e aponta para o perfil', () => {
    render(<PrestadorCard prestador={prestador()} session={null} />)

    const principal = screen.getByRole('link', { name: /ver perfil de antonio landim reformas/i })
    expect(principal.getAttribute('href')).toBe(getPerfilHref('antonio-landim-reformas', 7))
  })

  it('perfil público: "Este perfil é seu?" é um link de verdade, com o nome codificado', () => {
    render(<PrestadorCard prestador={prestador({ nome: 'José D’Ávila' })} session={null} />)

    const reivindicar = screen.getByRole('link', { name: 'Este perfil é seu?' })
    expect(reivindicar.tagName).toBe('A')
    expect(reivindicar.getAttribute('href')).toBe(`/reivindicar?id=7&nome=${encodeURIComponent('José D’Ávila')}`)
  })

  it('nenhum link fica dentro de outro link', () => {
    render(<PrestadorCard prestador={prestador()} session={null} />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link.parentElement?.closest('a')).toBeNull()
    }
  })

  it('perfil público mostra o selo "Perfil público"; perfil comum não mostra selo nem o link de reivindicação', () => {
    const { unmount } = render(<PrestadorCard prestador={prestador()} session={null} />)
    expect(screen.getByText('Perfil público')).toBeTruthy()
    unmount()

    render(<PrestadorCard prestador={prestador({ origem_tipo: 'cadastro' })} session={null} />)
    expect(screen.queryByText('Perfil público')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Este perfil é seu?' })).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('clicar no link principal registra o log; clicar em "Este perfil é seu?" não registra', () => {
    const registrarLog = vi.fn()
    render(<PrestadorCard prestador={prestador()} session={null} registrarLog={registrarLog} />)

    fireEvent.click(screen.getByRole('link', { name: 'Este perfil é seu?' }))
    expect(registrarLog).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('link', { name: /ver perfil de/i }))
    expect(registrarLog).toHaveBeenCalledWith('CLIQUE_PERFIL', { nome: 'Antonio Landim Reformas' })
  })

  it('sem foto, mostra as iniciais; o nome continua sendo o texto do link', () => {
    render(<PrestadorCard prestador={prestador()} session={null} />)

    expect(screen.getByText('AL')).toBeTruthy()
    expect(screen.getByRole('link', { name: /antonio landim reformas/i })).toBeTruthy()
  })
})