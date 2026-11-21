import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

afterEach(cleanup)

describe('PageHeader', () => {
  it('título e ações ficam na mesma linha (também no celular); a descrição vem embaixo', () => {
    render(<PageHeader titulo="Convites" descricao="Contato com os profissionais." acoes={<button>Atualizar</button>} />)
    const titulo = screen.getByRole('heading', { name: 'Convites' })
    const botao = screen.getByRole('button', { name: 'Atualizar' })
    const linha = titulo.parentElement!
    expect(linha.contains(botao)).toBe(true)
    expect(linha.className).not.toContain('flex-col')
    expect(linha.contains(screen.getByText('Contato com os profissionais.'))).toBe(false)
  })

  it('sem ações, mostra só o título e a descrição', () => {
    render(<PageHeader titulo="Feed" descricao="Trabalhos aceitos." />)
    expect(screen.getByRole('heading', { name: 'Feed' })).toBeTruthy()
    expect(screen.getByText('Trabalhos aceitos.')).toBeTruthy()
  })
})
