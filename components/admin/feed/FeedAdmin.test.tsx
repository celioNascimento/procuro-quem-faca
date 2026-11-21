import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ItemFeedAdmin } from '@/lib/feed/adminFeed'

const estado = vi.hoisted(() => ({
  remover: vi.fn(), devolver: vi.fn(),
  resumo: { itens: [] as unknown[], porDia: [] as unknown[] },
  carregando: false,
}))
vi.mock('@/hooks/admin/useAdminFeed', () => ({
  useAdminFeed: () => ({ resumo: estado.resumo, carregando: estado.carregando, processandoId: null, erro: null, remover: estado.remover, devolver: estado.devolver }),
}))

import { FeedAdmin } from './FeedAdmin'

function item(extra: Partial<ItemFeedAdmin> = {}): ItemFeedAdmin {
  return { projetoId: 'p1', titulo: 'Pintura da sala', prestadorId: 1, prestadorNome: 'Ana', prestadorSlug: 'ana', cidade: 'Londrina', aceitoEm: '2026-11-20T12:00:00Z', totalFotos: 3, motivoRemocao: null, situacao: 'no_ar', ...extra }
}

describe('Feed no admin', () => {
  afterEach(() => { cleanup(); estado.remover.mockReset(); estado.devolver.mockReset(); estado.resumo = { itens: [], porDia: [] } })

  it('sem trabalhos, explica quando eles aparecem', () => {
    render(<FeedAdmin />)
    expect(screen.getByRole('heading', { name: 'Feed' })).toBeTruthy()
    expect(screen.getByText('Nenhum trabalho no feed ainda')).toBeTruthy()
  })

  it('mostra o total por dia e a situação de cada trabalho', () => {
    estado.resumo = { itens: [item(), item({ projetoId: 'p2', situacao: 'retirado_cliente' })], porDia: [{ dia: '2026-11-19', total: 1 }, { dia: '2026-11-20', total: 2 }] }
    render(<FeedAdmin />)
    expect(screen.getByText('3 nos últimos 2 dias')).toBeTruthy()
    expect(screen.getByText('No feed')).toBeTruthy()
    expect(screen.getByText('Retirado pelo cliente')).toBeTruthy()
  })

  it('remover exige o motivo: sem texto não chama o banco', async () => {
    estado.resumo = { itens: [item()], porDia: [] }
    render(<FeedAdmin />)
    fireEvent.click(screen.getByRole('button', { name: 'Remover do feed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Escreva o motivo/))
    expect(estado.remover).not.toHaveBeenCalled()
  })

  it('com motivo, remove e fecha o formulário', async () => {
    estado.remover.mockResolvedValue(true)
    estado.resumo = { itens: [item()], porDia: [] }
    render(<FeedAdmin />)
    fireEvent.click(screen.getByRole('button', { name: 'Remover do feed' }))
    fireEvent.change(screen.getByLabelText(/Motivo da remoção/), { target: { value: 'Foto de outra pessoa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }))
    await waitFor(() => expect(estado.remover).toHaveBeenCalledWith('p1', 'Foto de outra pessoa'))
    await waitFor(() => expect(screen.queryByLabelText(/Motivo da remoção/)).toBeNull())
  })

  it('o que a equipe removeu mostra o motivo e permite devolver; retirada do cliente não tem botões', () => {
    estado.resumo = { itens: [item({ situacao: 'removido_admin', motivoRemocao: 'Golpe' }), item({ projetoId: 'p2', situacao: 'retirado_cliente' })], porDia: [] }
    render(<FeedAdmin />)
    expect(screen.getByText(/Motivo da remoção: Golpe/)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Devolver ao feed' })).toHaveLength(1)
    expect(screen.queryAllByRole('button', { name: 'Remover do feed' })).toHaveLength(0)
  })

  it('devolver chama a ação com o trabalho certo', async () => {
    estado.devolver.mockResolvedValue(true)
    estado.resumo = { itens: [item({ situacao: 'removido_admin', motivoRemocao: 'Golpe' })], porDia: [] }
    render(<FeedAdmin />)
    fireEvent.click(screen.getByRole('button', { name: 'Devolver ao feed' }))
    await waitFor(() => expect(estado.devolver).toHaveBeenCalledWith('p1'))
  })
})
