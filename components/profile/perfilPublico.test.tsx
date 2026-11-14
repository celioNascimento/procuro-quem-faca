// components/profile/perfilPublico.test.tsx
//
// Peças do perfil público: aviso de perfil montado com dados públicos, "Sobre" com bio automática,
// avatar com o ícone da área e anúncio em faixa fina.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type { PrestadorPerfil } from '@/types/perfil'

vi.mock('next/link', () => ({
  default: ({ href, children, ...resto }: ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...resto}>{children}</a>
  ),
}))

import AvisoPerfilPublico from '@/components/profile/AvisoPerfilPublico'
import PerfilSobre from '@/components/profile/PerfilSobre'
import PerfilHero from '@/components/profile/PerfilHero'

afterEach(cleanup)

function perfil(extra: Partial<PrestadorPerfil> = {}): PrestadorPerfil {
  return {
    id: '7',
    nome: 'Antonio Landim Reformas',
    slug: 'antonio-landim-reformas',
    bio: 'Profissional qualificado disponível para atendimentos na região.',
    foto_perfil: null,
    bairro: null,
    cidades: { nome: 'Londrina', estado_sigla: 'PR' },
    categorias: { nome: 'Pedreiro' },
    ...extra,
  } as PrestadorPerfil
}

describe('AvisoPerfilPublico', () => {
  it('explica a origem dos dados e leva a reivindicar o perfil, com o nome codificado', () => {
    render(<AvisoPerfilPublico prestadorId="7" nome="José D’Ávila" />)

    expect(screen.getByText(/dados públicos de contato/i)).toBeTruthy()
    const link = screen.getByRole('link', { name: /assuma o perfil/i })
    expect(link.getAttribute('href')).toBe(`/reivindicar?id=7&nome=${encodeURIComponent('José D’Ávila')}`)
  })
})

describe('PerfilSobre', () => {
  it('com a bio padrão do cadastro automático, mostra "Categoria em Cidade."', () => {
    render(<PerfilSobre prestador={perfil()} />)

    expect(screen.getByText('Pedreiro em Londrina.')).toBeTruthy()
    expect(screen.queryByText(/profissional qualificado/i)).toBeNull()
  })

  it('com bio própria, mostra a bio', () => {
    render(<PerfilSobre prestador={perfil({ bio: 'Faço reformas completas.' })} />)

    expect(screen.getByText('Faço reformas completas.')).toBeTruthy()
  })

  it('sem bio própria e sem categoria, a seção não aparece', () => {
    const { container } = render(<PerfilSobre prestador={perfil({ categorias: null, categoria: undefined })} />)

    expect(container.firstChild).toBeNull()
  })
})

describe('PerfilHero', () => {
  const props = { compartilhando: false, onCompartilhar: () => {} }

  it('sem foto e com área conhecida, mostra o ícone da área (não "Sem Logo")', () => {
    const { container } = render(<PerfilHero prestador={perfil({ grupo_icone: 'hammer' })} {...props} />)

    expect(container.querySelector('svg.lucide-hammer')).toBeTruthy()
    expect(screen.queryByText(/sem logo/i)).toBeNull()
  })

  it('sem foto e sem ícone conhecido, mostra as iniciais', () => {
    render(<PerfilHero prestador={perfil({ grupo_icone: null })} {...props} />)

    expect(screen.getByText('AL')).toBeTruthy()
  })

  it('com foto, mostra a foto', () => {
    const { container } = render(
      <PerfilHero prestador={perfil({ grupo_icone: 'hammer', foto_perfil: 'https://x.test/a.jpg' })} {...props} />,
    )

    expect(container.querySelector('img')).toBeTruthy()
    expect(container.querySelector('svg.lucide-hammer')).toBeNull()
  })

  it('não mostra o @slug (é só o endereço da página)', () => {
    render(<PerfilHero prestador={perfil()} {...props} />)

    expect(screen.queryByText(/@antonio-landim-reformas/)).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Antonio Landim Reformas' })).toBeTruthy()
  })
})
