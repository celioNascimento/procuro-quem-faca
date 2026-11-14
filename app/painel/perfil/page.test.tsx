import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const estado = vi.hoisted(() => ({ valor: {} as Record<string, unknown> }))

vi.mock('@/hooks/usePerfilCliente', () => ({ usePerfilCliente: () => estado.valor }))
vi.mock('@/components/perfil/HeaderCliente', () => ({ default: () => null }))
vi.mock('@/components/perfil/CardPerfilCliente', () => ({ default: () => null }))
vi.mock('@/components/painel/AdCardPainelCliente', () => ({ AdCardPainelCliente: () => null }))
vi.mock('@/components/painel/CardResumoAvaliacoesCliente', () => ({ CardResumoAvaliacoesCliente: () => null }))
vi.mock('@/components/help/HelpCenter', () => ({ ContextualHelp: () => null }))
vi.mock('@/components/account/DangerZone', () => ({ default: () => null }))
vi.mock('@/components/skeletons/PainelDoClienteSkeleton', () => ({ default: () => <div data-testid="esqueleto" /> }))

import PerfilDoCliente from './page'

function base(extra: Record<string, unknown> = {}) {
  return {
    fileInputRef: { current: null }, filtroRef: { current: null },
    irParaAvaliar: vi.fn(), aba: 'servicos', setAba: vi.fn(),
    filtroStatus: 'todos', setFiltroStatus: vi.fn(),
    loading: false, perfilCarregado: true, uploading: false, loadingServicos: false, showSuccess: false,
    errorModal: { show: false, title: '', message: '' }, setErrorModal: vi.fn(),
    confirmLeaveModal: { show: false, destination: '' }, confirmarSaida: vi.fn(), cancelarSaida: vi.fn(),
    servicos: [], isDirty: false, listaEstados: [], listaCidades: [],
    perfil: { full_name: 'Ana', email: 'a@a.com', whatsapp: '', logradouro: '', numero: '', bairro: '', complemento: '', uf: '', cidade: '', avatar_url: '' },
    aplicarMascara: (v: string) => v, irPara: vi.fn(), handleChangePerfil: vi.fn(), handleUploadFoto: vi.fn(), atualizar: vi.fn(),
    getStatusInfo: () => ({ label: 'x', dot: '', badge: '', urgente: false }), getRota: () => '/x',
    idsComGarantiaAtiva: new Set(), idsComReclamacaoAtiva: new Set(),
    servicosFiltrados: [], avaliarCount: 0, ativosCount: 0, garantiaCount: 0, reclamacaoCount: 0,
    pendentesCount: 0, andamentoCount: 0, finalizadosCount: 0,
    ...extra,
  }
}

describe('/painel/perfil', () => {
  beforeEach(() => { estado.valor = base() })

  it('mostra o esqueleto só enquanto carrega — e não some a tela ao salvar', () => {
    estado.valor = base({ perfilCarregado: false })
    const { unmount } = render(<PerfilDoCliente />)
    expect(screen.getByTestId('esqueleto')).toBeTruthy()
    unmount()

    estado.valor = base({ loading: true }) // salvando
    render(<PerfilDoCliente />)
    expect(screen.queryByTestId('esqueleto')).toBeNull()
    expect(screen.getByRole('heading', { name: /acompanhe seus trabalhos/i })).toBeTruthy()
  })

  it('só pede para deslizar quando há mais de um aviso', () => {
    estado.valor = base({ avaliarCount: 1 })
    const { unmount } = render(<PerfilDoCliente />)
    expect(screen.queryByText(/deslize para ver mais avisos/i)).toBeNull()
    unmount()
    estado.valor = base({ avaliarCount: 1, garantiaCount: 1 })
    render(<PerfilDoCliente />)
    expect(screen.getByText(/deslize para ver mais avisos/i)).toBeTruthy()
  })

  it('os números dos filtros vêm do hook', () => {
    estado.valor = base({ servicos: [{}, {}], pendentesCount: 1, andamentoCount: 0, avaliarCount: 1, finalizadosCount: 0 })
    render(<PerfilDoCliente />)
    expect(screen.getByRole('button', { name: 'Para aceitar (1)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Em andamento (0)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Avaliar (1)' })).toBeTruthy()
  })

  it('na aba Minha conta os campos têm rótulo ligado', () => {
    estado.valor = base({ aba: 'dados' })
    render(<PerfilDoCliente />)
    for (const nome of ['Nome completo', 'WhatsApp', 'Logradouro', 'Nº', 'Bairro', 'Complemento', 'UF', 'Cidade']) {
      expect(screen.getByLabelText(nome)).toBeTruthy()
    }
  })

  it('saída com alterações abre o diálogo acessível e Esc cancela', () => {
    const cancelarSaida = vi.fn()
    estado.valor = base({ confirmLeaveModal: { show: true, destination: '/x' }, cancelarSaida })
    render(<PerfilDoCliente />)
    expect(screen.getByRole('dialog', { name: 'Sair sem salvar?' })).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(cancelarSaida).toHaveBeenCalled()
  })

  it('aviso de erro aparece com o título certo e fecha', () => {
    const setErrorModal = vi.fn()
    estado.valor = base({ errorModal: { show: true, title: 'Telefone inválido', message: 'Use 10 ou 11 dígitos.' }, setErrorModal })
    render(<PerfilDoCliente />)
    expect(screen.getByRole('dialog', { name: 'Telefone inválido' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    expect(setErrorModal).toHaveBeenCalled()
  })
})
