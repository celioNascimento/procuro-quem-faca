import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
