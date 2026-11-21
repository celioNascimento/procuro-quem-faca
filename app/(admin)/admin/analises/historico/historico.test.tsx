import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { AcaoAdmin } from '@/lib/admin/acoes'

const servico = vi.hoisted(() => ({ listar: vi.fn() }))
vi.mock('@/lib/services/adminAcoes.service', () => ({ LIMITE_ACOES: 200, listarAcoesAdmin: servico.listar }))

import HistoricoPage from './page'

afterEach(() => { cleanup(); servico.listar.mockReset() })

const acao = (extra: Partial<AcaoAdmin>): AcaoAdmin => ({
  id: 1, quando: '2026-11-21T10:00:00Z', admin_id: 'u', admin_email: 'celio.gih@gmail.com', acao: 'bloqueou_prestador',
  alvo_tipo: 'prestador', alvo_id: '7', alvo_nome: 'Ana', motivo: 'Perfil falso', detalhes: {}, ...extra,
})

describe('Histórico de ações', () => {
  it('mostra frase, motivo e tipo; filtra por tipo de ação', async () => {
    servico.listar.mockResolvedValue([
      acao({ id: 1 }),
      acao({ id: 2, acao: 'removeu_do_feed', alvo_nome: 'Pintura', motivo: null }),
    ])
    render(<HistoricoPage />)
    await waitFor(() => expect(screen.getAllByTestId('historico-item')).toHaveLength(2))
    const [primeiro] = screen.getAllByTestId('historico-item')
    expect(within(primeiro).getByText('celio.gih bloqueou Ana')).toBeTruthy()
    expect(within(primeiro).getByText('Motivo: Perfil falso')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Tipo de ação'), { target: { value: 'feed' } })
    expect(screen.getAllByTestId('historico-item')).toHaveLength(1)
    expect(screen.getByText('celio.gih removeu o trabalho "Pintura" do feed')).toBeTruthy()
  })

  it('sem ações explica quando algo aparece aqui; com erro avisa', async () => {
    servico.listar.mockResolvedValueOnce([])
    render(<HistoricoPage />)
    await waitFor(() => expect(screen.getByText('Nada por aqui')).toBeTruthy())
    cleanup()
    servico.listar.mockRejectedValueOnce(new Error('x'))
    render(<HistoricoPage />)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Não foi possível carregar o histórico'))
  })
})
