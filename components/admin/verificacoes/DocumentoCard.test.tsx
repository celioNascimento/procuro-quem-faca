import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CHECKLIST } from '@/lib/selos/checklistDocumentos'
import { DocumentoCard } from './DocumentoCard'
import type { DocumentoAdmin } from '@/lib/services/documentosVerificacao.service'

afterEach(cleanup)

const VAZIO = { motivo: '', validoAte: '', emissao: '', marcados: [] as string[] }
const TODOS = CHECKLIST.seguro.map((i) => i.id)

const base: DocumentoAdmin = {
  verificacao_id: 'v1', prestador_id: 1, prestador_nome: 'Pedro', prestador_slug: 'pedro', tipo: 'seguro',
  status: 'pendente', valido_ate: null, criado_em: '2026-11-18T12:00:00Z', verificado_em: null, cnpj: '11222333000181', razao_social: 'EMPRESA TESTE LTDA',
  dados: { pedido: { seguradora: 'Porto', numero_apolice: 'A1', validade_informada: '2027-01-01', arquivo: 'u/x.pdf' } },
}
const props = { processando: null, onCampos: vi.fn(), onAlternarItem: vi.fn(), onAbrir: vi.fn(), onAprovar: vi.fn(), onRejeitar: vi.fn() }

describe('DocumentoCard', () => {
  it('seguro: mostra os dados e só libera aprovar com a validade preenchida', () => {
    const { rerender } = render(<DocumentoCard {...props} item={base} campos={VAZIO} />)
    expect(screen.getByText('Porto')).toBeTruthy()
    expect((screen.getByTestId('documento-aprovar') as HTMLButtonElement).disabled).toBe(true)
    rerender(<DocumentoCard {...props} item={base} campos={{ ...VAZIO, validoAte: '2027-01-01', marcados: TODOS }} />)
    expect((screen.getByTestId('documento-aprovar') as HTMLButtonElement).disabled).toBe(false)
  })

  it('com a validade mas sem a checklist completa, não libera aprovar', () => {
    render(<DocumentoCard {...props} item={base} campos={{ ...VAZIO, validoAte: '2027-01-01', marcados: TODOS.slice(1) }} />)
    expect((screen.getByTestId('documento-aprovar') as HTMLButtonElement).disabled).toBe(true)
  })

  it('mostra o CNPJ do perfil para comparar com o titular; sem CNPJ, avisa', () => {
    const { rerender } = render(<DocumentoCard {...props} item={base} campos={VAZIO} />)
    expect(screen.getByTestId('documento-cnpj-perfil').textContent).toContain('EMPRESA TESTE LTDA')
    rerender(<DocumentoCard {...props} item={{ ...base, cnpj: null, razao_social: null }} campos={VAZIO} />)
    expect(screen.getByTestId('documento-cnpj-perfil').textContent).toMatch(/não tem CNPJ/)
  })

  it('marcar um item chama a ação', () => {
    render(<DocumentoCard {...props} item={base} campos={VAZIO} />)
    fireEvent.click(screen.getByTestId('check-segurado'))
    expect(props.onAlternarItem).toHaveBeenCalledWith('segurado')
  })

  it('CND pede a data de emissão (não a validade)', () => {
    render(<DocumentoCard {...props} item={{ ...base, tipo: 'cnd', dados: { pedido: { arquivo: 'u/c.pdf' } } }} campos={VAZIO} />)
    expect(screen.getByTestId('documento-emissao')).toBeTruthy()
    expect(screen.queryByTestId('documento-validade')).toBeNull()
  })

  it('rejeitar exige motivo', () => {
    const { rerender } = render(<DocumentoCard {...props} item={base} campos={VAZIO} />)
    expect((screen.getByTestId('documento-rejeitar') as HTMLButtonElement).disabled).toBe(true)
    rerender(<DocumentoCard {...props} item={base} campos={{ ...VAZIO, motivo: 'Ilegível' }} />)
    fireEvent.click(screen.getByTestId('documento-rejeitar'))
    expect(props.onRejeitar).toHaveBeenCalled()
  })

  it('item já decidido não mostra ações', () => {
    render(<DocumentoCard {...props} item={{ ...base, status: 'aprovada', valido_ate: '2027-06-01', dados: { conferido: { seguradora: 'Porto' } } }} campos={VAZIO} />)
    expect(screen.queryByTestId('documento-aprovar')).toBeNull()
  })

  it('mostra há quantos dias o pedido espera e avisa perto do prazo de 60 dias', () => {
    const velho = new Date(Date.now() - 50 * 86_400_000).toISOString()
    const novo = new Date(Date.now() - 2 * 86_400_000).toISOString()
    const { rerender } = render(<DocumentoCard {...props} item={{ ...base, dados: { pedido: { ...(base.dados.pedido as object), enviado_em: novo } } }} campos={VAZIO} />)
    expect(screen.getByTestId('documento-espera').textContent).toMatch(/há 2 dias/)
    expect(screen.getByTestId('documento-espera').textContent).not.toMatch(/Decida logo/)
    rerender(<DocumentoCard {...props} item={{ ...base, dados: { pedido: { ...(base.dados.pedido as object), enviado_em: velho } } }} campos={VAZIO} />)
    expect(screen.getByTestId('documento-espera').textContent).toMatch(/Decida logo/)
  })
})
