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
vi.mock('@/hooks/useCompartilharTrabalho', () => ({
  useCompartilharTrabalho: () => ({ compartilhar: vi.fn(), confirmacao: null, erro: null }),
}))
vi.mock('@/lib/services/feed.service', () => ({
  fetchCategoriasDoFiltro: vi.fn().mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', nome: 'Pintor' }]),
  fetchCidadesDoFeed: vi.fn().mockResolvedValue([{ id: '15123e3f-9f76-4d66-b2ee-f03c45de38fa', nome: 'Londrina', estadoSigla: 'PR' }, { id: '22222222-2222-4222-8222-222222222222', nome: 'Campinas', estadoSigla: 'SP' }]),
}))

import FeedPage from './page'

const CIDADE = '15123e3f-9f76-4d66-b2ee-f03c45de38fa'
const CAMPINAS = '22222222-2222-4222-8222-222222222222'
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
    expect(h.filtrosRecebidos.at(-1)).toEqual({ categoriaId: null, cidadeId: CIDADE, estado: null })
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
  it('lista os estados que têm trabalho, sem repetir, e começa em "Todos os estados"', async () => {
    render(<FeedPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'SP' })).toBeTruthy())
    const opcoes = Array.from((screen.getByTestId('feed-estado') as HTMLSelectElement).options).map(o => o.value)
    expect(opcoes).toEqual(['', 'PR', 'SP'])
    expect((screen.getByTestId('feed-estado') as HTMLSelectElement).value).toBe('')
  })
  it('escolher o estado vai para o endereço e a lista de cidades mostra só as dele', async () => {
    h.query = 'estado=PR'
    render(<FeedPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Londrina - PR' })).toBeTruthy())
    expect(screen.queryByRole('option', { name: 'Campinas - SP' })).toBeNull()
    expect(h.filtrosRecebidos.at(-1)).toEqual({ categoriaId: null, cidadeId: null, estado: 'PR' })
    fireEvent.change(screen.getByTestId('feed-estado'), { target: { value: 'SP' } })
    expect(h.replace).toHaveBeenCalledWith('/feed?estado=SP', { scroll: false })
  })
  it('trocar de estado tira a cidade que não é daquele estado do endereço', async () => {
    h.query = `estado=PR&cidade=${CIDADE}`
    render(<FeedPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'SP' })).toBeTruthy())
    fireEvent.change(screen.getByTestId('feed-estado'), { target: { value: 'SP' } })
    expect(h.replace).toHaveBeenCalledWith('/feed?estado=SP', { scroll: false })
    h.replace.mockReset()
    h.query = `estado=SP&cidade=${CAMPINAS}`
    cleanup(); render(<FeedPage />)
    await waitFor(() => expect(screen.getByRole('option', { name: 'SP' })).toBeTruthy())
    fireEvent.change(screen.getByTestId('feed-estado'), { target: { value: '' } })
    expect(h.replace).toHaveBeenCalledWith(`/feed?cidade=${CAMPINAS}`, { scroll: false })
  })
  it('"Ver todos os trabalhos" também limpa o estado', () => {
    h.query = 'estado=SP'
    render(<FeedPage />)
    fireEvent.click(screen.getByTestId('feed-limpar-filtros'))
    expect(h.replace).toHaveBeenCalledWith('/feed', { scroll: false })
  })
})
