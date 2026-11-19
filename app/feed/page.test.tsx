import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach } from 'vitest'

const h = vi.hoisted(() => ({ replace: vi.fn(), query: '', filtrosRecebidos: [] as unknown[], itens: [] as unknown[] }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: h.replace }),
  usePathname: () => '/feed',
  useSearchParams: () => new URLSearchParams(h.query),
}))
vi.mock('@/components/Header', () => ({ default: () => null }))
vi.mock('@/hooks/useSession', () => ({ useSession: () => null }))
vi.mock('@/hooks/useFeed', () => ({
  useFeed: (_logado: boolean, filtros: unknown) => {
    h.filtrosRecebidos.push(filtros)
    return { aba: 'todos', setAba: vi.fn(), itens: h.itens, temMais: false, carregando: false, erro: null, aviso: null, carregarMais: vi.fn(), curtir: vi.fn(), alternarSeguir: vi.fn() }
  },
}))
vi.mock('@/lib/services/feed.service', () => ({
  fetchCategoriasDoFiltro: vi.fn().mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', nome: 'Pintor' }]),
  fetchCidadesDoFeed: vi.fn().mockResolvedValue([{ id: '15123e3f-9f76-4d66-b2ee-f03c45de38fa', nome: 'Londrina', estadoSigla: 'PR' }]),
}))

import FeedPage from './page'

const CIDADE = '15123e3f-9f76-4d66-b2ee-f03c45de38fa'
const CATEGORIA = '11111111-1111-4111-8111-111111111111'

beforeEach(() => { h.replace.mockReset(); h.query = ''; h.filtrosRecebidos = []; h.itens = [] })
afterEach(cleanup)

describe('página do feed — filtros na URL', () => {
  it('lista só as cidades que vieram do banco (com o estado) e começa em "Todas"', async () => {
    render(<FeedPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Londrina - PR' })).toBeTruthy())
    expect((screen.getByTestId('feed-cidade') as HTMLSelectElement).value).toBe('')
  })
  it('escolher a cidade troca o endereço (replace), mantendo o tipo de serviço', async () => {
    h.query = `categoria=${CATEGORIA}`
    render(<FeedPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Londrina - PR' })).toBeTruthy())
    fireEvent.change(screen.getByTestId('feed-cidade'), { target: { value: CIDADE } })
    expect(h.replace).toHaveBeenCalledWith(`/feed?categoria=${CATEGORIA}&cidade=${CIDADE}`, { scroll: false })
  })
  it('voltar para "Todas as cidades" tira só a cidade do endereço', async () => {
    h.query = `cidade=${CIDADE}`
    render(<FeedPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Londrina - PR' })).toBeTruthy())
    fireEvent.change(screen.getByTestId('feed-cidade'), { target: { value: '' } })
    expect(h.replace).toHaveBeenCalledWith('/feed', { scroll: false })
  })
  it('o filtro do endereço chega ao feed; link adulterado vira sem filtro', () => {
    h.query = `cidade=${CIDADE}&categoria=lixo`
    render(<FeedPage />)
    expect(h.filtrosRecebidos.at(-1)).toEqual({ categoriaId: null, cidadeId: CIDADE })
  })
  it('sem resultado com filtro: explica e oferece "Ver todos os trabalhos", que limpa os dois filtros', () => {
    h.query = `cidade=${CIDADE}&categoria=${CATEGORIA}`
    render(<FeedPage />)
    expect(screen.getByTestId('feed-vazio').textContent).toMatch(/Nenhum trabalho com esses filtros/)
    fireEvent.click(screen.getByTestId('feed-limpar-filtros'))
    expect(h.replace).toHaveBeenCalledWith('/feed', { scroll: false })
  })
  it('sem resultado e sem filtro: mostra a explicação de sempre, sem botão de limpar', () => {
    render(<FeedPage />)
    expect(screen.getByTestId('feed-vazio').textContent).toMatch(/Ainda não há trabalhos/)
    expect(screen.queryByTestId('feed-limpar-filtros')).toBeNull()
  })
})
