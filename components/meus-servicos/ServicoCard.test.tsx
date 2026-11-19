import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ServicoCard from './ServicoCard'
import { TEXTO_AVISO_FEED } from '@/config/feed'
import type { Servico } from '@/types/painel'

afterEach(cleanup)

const servico = {
  id: 's1', titulo: 'Pintura da sala', status: 'pendente', avaliacao_token: 'tok-1', created_at: '2026-11-10T10:00:00Z',
  sem_fotos: true, marcado_concluido_at: null, portfolio_fotos: [], solicitacoes_garantia: [], avaliacoes: [],
  prestadores: { id: 'p1', nome: 'João Pintor', foto_perfil: null, whatsapp: '43999990000', categoria: { nome: 'Pintor', categorias_grupos: { icone: 'hammer' } } },
} as unknown as Servico

describe('ServicoCard: aviso do feed no aceite', () => {
  it('antes de aceitar, o cliente lê que as fotos vão para o feed e que pode tirar depois', () => {
    render(<ServicoCard servico={servico} onZoom={vi.fn()} onAceitar={vi.fn()} modo="pendente" />)
    expect(screen.getByTestId('aviso-feed-aceite').textContent).toBe(TEXTO_AVISO_FEED)
    expect(screen.getByRole('button', { name: /aceitar trabalho/i })).toBeTruthy()
  })
  it('depois de aceito, o aviso não aparece mais', () => {
    render(<ServicoCard servico={servico} onZoom={vi.fn()} onAceitar={vi.fn()} modo="andamento" />)
    expect(screen.queryByTestId('aviso-feed-aceite')).toBeNull()
  })
})

describe('ServicoCard: Retirar do feed', () => {
  const noFeed = { ...servico, status: 'finalizado', feed_aceito_em: '2026-11-19T10:00:00Z', feed_revogado_em: null } as unknown as Servico

  it('concluído e no feed: mostra o botão e avisa o pai ao tocar', () => {
    const onRetirarDoFeed = vi.fn()
    render(<ServicoCard servico={noFeed} onZoom={vi.fn()} onAceitar={vi.fn()} modo="concluido" onRetirarDoFeed={onRetirarDoFeed} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retirar do feed' }))
    expect(onRetirarDoFeed).toHaveBeenCalledWith(noFeed)
  })
  it('não mostra se já foi retirado, se não entrou no feed ou se falta o callback', () => {
    const { rerender } = render(<ServicoCard servico={{ ...noFeed, feed_revogado_em: '2026-11-20T10:00:00Z' } as Servico} onZoom={vi.fn()} onAceitar={vi.fn()} modo="concluido" onRetirarDoFeed={vi.fn()} />)
    expect(screen.queryByTestId('retirar-feed-bloco')).toBeNull()
    rerender(<ServicoCard servico={{ ...noFeed, feed_aceito_em: null } as Servico} onZoom={vi.fn()} onAceitar={vi.fn()} modo="concluido" onRetirarDoFeed={vi.fn()} />)
    expect(screen.queryByTestId('retirar-feed-bloco')).toBeNull()
    rerender(<ServicoCard servico={noFeed} onZoom={vi.fn()} onAceitar={vi.fn()} modo="concluido" />)
    expect(screen.queryByTestId('retirar-feed-bloco')).toBeNull()
  })
  it('trava o botão enquanto outra ação está sendo enviada', () => {
    render(<ServicoCard servico={noFeed} onZoom={vi.fn()} onAceitar={vi.fn()} modo="concluido" ocupado onRetirarDoFeed={vi.fn()} />)
    expect((screen.getByRole('button', { name: 'Retirar do feed' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
