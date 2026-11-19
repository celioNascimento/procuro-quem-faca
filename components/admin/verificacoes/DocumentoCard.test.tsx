import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DocumentoCard } from './DocumentoCard'
import type { DocumentoAdmin } from '@/lib/services/documentosVerificacao.service'

afterEach(cleanup)

const base: DocumentoAdmin = {
  verificacao_id: 'v1', prestador_id: 1, prestador_nome: 'Pedro', prestador_slug: 'pedro', tipo: 'seguro',
  status: 'pendente', valido_ate: null, criado_em: '2026-11-18T12:00:00Z', verificado_em: null,
  dados: { pedido: { seguradora: 'Porto', numero_apolice: 'A1', validade_informada: '2027-01-01', arquivo: 'u/x.pdf' } },
}
const props = { processando: null, onCampos: vi.fn(), onAbrir: vi.fn(), onAprovar: vi.fn(), onRejeitar: vi.fn() }

describe('DocumentoCard', () => {
  it('seguro: mostra os dados e só libera aprovar com a validade preenchida', () => {
    const { rerender } = render(<DocumentoCard {...props} item={base} campos={{ motivo: '', validoAte: '', emissao: '' }} />)
    expect(screen.getByText('Porto')).toBeTruthy()
    expect((screen.getByTestId('documento-aprovar') as HTMLButtonElement).disabled).toBe(true)
    rerender(<DocumentoCard {...props} item={base} campos={{ motivo: '', validoAte: '2027-01-01', emissao: '' }} />)
    expect((screen.getByTestId('documento-aprovar') as HTMLButtonElement).disabled).toBe(false)
  })

  it('CND pede a data de emissão (não a validade)', () => {
    render(<DocumentoCard {...props} item={{ ...base, tipo: 'cnd', dados: { pedido: { arquivo: 'u/c.pdf' } } }} campos={{ motivo: '', validoAte: '', emissao: '' }} />)
    expect(screen.getByTestId('documento-emissao')).toBeTruthy()
    expect(screen.queryByTestId('documento-validade')).toBeNull()
  })

  it('rejeitar exige motivo', () => {
    const { rerender } = render(<DocumentoCard {...props} item={base} campos={{ motivo: '', validoAte: '', emissao: '' }} />)
    expect((screen.getByTestId('documento-rejeitar') as HTMLButtonElement).disabled).toBe(true)
    rerender(<DocumentoCard {...props} item={base} campos={{ motivo: 'Ilegível', validoAte: '', emissao: '' }} />)
    fireEvent.click(screen.getByTestId('documento-rejeitar'))
    expect(props.onRejeitar).toHaveBeenCalled()
  })

  it('item já decidido não mostra ações', () => {
    render(<DocumentoCard {...props} item={{ ...base, status: 'aprovada', valido_ate: '2027-06-01', dados: { conferido: { seguradora: 'Porto' } } }} campos={{ motivo: '', validoAte: '', emissao: '' }} />)
    expect(screen.queryByTestId('documento-aprovar')).toBeNull()
  })
})
