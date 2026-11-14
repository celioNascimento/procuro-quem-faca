import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const hookMock = vi.fn()
vi.mock('@/hooks/useUploadWizard', () => ({ useUploadWizard: () => hookMock() }))
vi.mock('@/hooks/useCasoGarantiaDoProjeto', () => ({
  useCasoGarantiaDoProjeto: () => ({ caso: null, loading: false, recarregar: vi.fn() }),
}))
vi.mock('@/components/dashboard/wizard/WizardCompleted', () => ({ WizardCompleted: () => <div>RESUMO-CONCLUIDO</div> }))
vi.mock('@/components/dashboard/wizard/WizardZoomModal', () => ({ WizardZoomModal: () => <div>MODAL-ZOOM</div> }))
vi.mock('@/components/dashboard/wizard/garantia/GarantiaSecaoWizard', () => ({ GarantiaSecaoWizard: () => <div>SECAO-GARANTIA</div> }))

import { UploadWizardContainer } from '@/components/dashboard/wizard/UploadWizardContainer'

type Sobrescritas = { state?: Record<string, unknown>; derived?: Record<string, unknown> }

function montar({ state = {}, derived = {} }: Sobrescritas = {}) {
  const actions = {
    setErroUpload: vi.fn(), setZoomEtapa: vi.fn(), handleUpload: vi.fn(), iniciarServicoSemFoto: vi.fn(),
    marcarComoConcluido: vi.fn(), escolherFluxo: vi.fn(), gerarLinkAceite: vi.fn().mockResolvedValue(true),
    gerarLinkConclusao: vi.fn().mockResolvedValue(true), copiarAceite: vi.fn().mockResolvedValue(true),
    copiarConclusao: vi.fn().mockResolvedValue(true), salvarDescricaoFoto: vi.fn().mockResolvedValue(true),
    salvarAutorizacaoFoto: vi.fn().mockResolvedValue(true), setClienteWhatsapp: vi.fn(), setClienteNome: vi.fn(),
    setTitulo: vi.fn(), selecionarProjeto: vi.fn(), iniciarEdicaoDadosCliente: vi.fn(),
    cancelarEdicaoDadosCliente: vi.fn(), salvarDadosCliente: vi.fn(), handleZoomClose: vi.fn(),
  }
  hookMock.mockReturnValue({
    state: {
      zoomEtapa: null, clienteWhatsapp: '', clienteNome: '', titulo: '', aguardandoAvaliacao: false, erroUpload: null,
      projetoId: null, projetosEncontrados: [], statusTitulo: 'ocioso', fotosUrls: { 1: null, 2: null, 3: null },
      fotosData: { 1: null, 2: null, 3: null }, loadingEtapa: {}, linkGerado: false, projetoStatus: 'pendente',
      marcandoConcluido: false, marcadoConcluidoAt: null, editandoDadosCliente: false, salvandoDadosCliente: false,
      erroDadosCliente: null,
      prestadorInfo: { nome: 'Ana', foto: null, whatsapp: '43900000000', slug: 'ana', portfolioObrigatorio: true, exemploDescricao: 'Bolo de dois andares para 40 pessoas.' },
      ...state,
    },
    derived: {
      isProjetoConcluido: false, isSelfNumber: false, isPhoneValid: false, isTitleValid: false, isProjetoPendente: true,
      semFotos: false, podeGerarLinkAvaliacao: false, mostrarEscolhaFluxo: false, fotoComPessoaSemAutorizacao: false,
      ...derived,
    },
    actions,
  })
  return actions
}

const foto = (extra = {}) => ({ id: 'f1', projeto_id: 'p1', url_foto: 'https://x.com/1.png', ordem: 1, prestador_id: 1, ...extra })

beforeEach(() => { hookMock.mockReset() })
afterEach(cleanup)

describe('UploadWizardContainer — trabalho novo', () => {
  it('mostra o passo 1 e diz o que fazer, sem palavras técnicas', () => {
    montar()
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} onVoltar={() => {}} />)

    expect(screen.getByText('Novo trabalho')).toBeTruthy()
    expect(screen.getByText('Quem é o cliente e qual foi o serviço?')).toBeTruthy()
    expect(screen.getByRole('status', { name: /o que fazer agora/i }).textContent).toMatch(/Preencha o WhatsApp do cliente/)
    expect(screen.queryByText(/em_registro|pendente|em execucao/i)).toBeNull()
  })

  it('a foto do antes fica bloqueada até os dados do cliente estarem preenchidos, com o motivo', () => {
    montar()
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    expect(screen.getByText(/preencha o whatsapp do cliente e o nome do serviço para liberar esta foto/i)).toBeTruthy()
  })

  it('dados válidos: libera a foto do antes e a frase passa a pedir a foto', () => {
    montar({ derived: { isPhoneValid: true, isTitleValid: true } , state: { clienteWhatsapp: '(43) 99999-0000', titulo: 'Bolo' } })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    expect(screen.getByText(/tirar ou escolher a foto/i)).toBeTruthy()
    expect(screen.getByRole('status', { name: /o que fazer agora/i }).textContent).toMatch(/Adicione a foto do antes/)
  })

  it('escolha entre com e sem fotos usa palavras do prestador', () => {
    const a = montar({ derived: { isPhoneValid: true, isTitleValid: true, mostrarEscolhaFluxo: true } })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /sem fotos/i }))
    expect(a.escolherFluxo).toHaveBeenCalledWith(true)
  })
})

describe('UploadWizardContainer — com fotos', () => {
  const comAntes = {
    projetoId: 'p1', titulo: 'Bolo de aniversário', clienteNome: 'Maria', clienteWhatsapp: '(43) 99999-0000',
    projetoStatus: 'em_registro', linkGerado: false, fotosUrls: { 1: 'https://x.com/1.png', 2: null, 3: null },
    fotosData: { 1: foto(), 2: null, 3: null },
  }

  it('foto do antes enviada: aparece o aceite e as fotos seguintes ficam bloqueadas com o motivo', () => {
    montar({ state: comAntes, derived: { isPhoneValid: true, isTitleValid: true } })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)

    expect(screen.getByRole('button', { name: /enviar o aceite pelo whatsapp/i })).toBeTruthy()
    expect(screen.getAllByText(/envie o aceite ao cliente para liberar esta foto/i)).toHaveLength(2)
    expect(screen.getByText('Rascunho: ainda não enviado ao cliente')).toBeTruthy()
    expect(screen.getByRole('status', { name: /o que fazer agora/i }).textContent).toMatch(/Envie o aceite ao cliente/)
  })

  it('aceite enviado: libera o durante e o depois, e o selo diz que espera o cliente', () => {
    montar({ state: { ...comAntes, projetoStatus: 'pendente', linkGerado: true }, derived: { isPhoneValid: true, isTitleValid: true } })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)

    expect(screen.queryByText(/para liberar esta foto/i)).toBeNull()
    expect(screen.getByText('Aguardando o cliente aceitar')).toBeTruthy()
    expect(screen.getByRole('status', { name: /o que fazer agora/i }).textContent).toMatch(/foto do durante/)
    expect(screen.getByText(/já enviado/i)).toBeTruthy()
  })

  it('pessoa na foto sem autorização bloqueia o envio ao cliente e explica', () => {
    montar({
      state: { ...comAntes, fotosData: { 1: foto({ contem_pessoas: true, consentimento_terceiros_confirmado: false }), 2: null, 3: null } },
      derived: { isPhoneValid: true, isTitleValid: true, fotoComPessoaSemAutorizacao: true },
    })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)

    const enviar = screen.getByRole('button', { name: /enviar o aceite pelo whatsapp/i }) as HTMLButtonElement
    expect(enviar.disabled).toBe(true)
    expect(screen.getAllByRole('alert').some((el) => /falta confirmar a autorização/i.test(el.textContent ?? ''))).toBe(true)
  })

  it('três fotos e aguardando avaliação: aparece o pedido de avaliação', () => {
    montar({
      state: {
        ...comAntes, projetoStatus: 'em_execucao', linkGerado: true, aguardandoAvaliacao: true,
        fotosUrls: { 1: 'a', 2: 'b', 3: 'c' }, fotosData: { 1: foto(), 2: foto({ ordem: 2 }), 3: foto({ ordem: 3 }) },
      },
      derived: { isPhoneValid: true, isTitleValid: true, isProjetoPendente: false, podeGerarLinkAvaliacao: true },
    })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    expect(screen.getByRole('button', { name: /pedir a avaliação pelo whatsapp/i })).toBeTruthy()
    expect(screen.getByText('Aguardando a avaliação do cliente')).toBeTruthy()
  })
})

describe('UploadWizardContainer — sem fotos e concluído', () => {
  it('antes de iniciar: botão "Iniciar serviço" só libera com os dados válidos', () => {
    montar({ derived: { semFotos: true, isPhoneValid: false, isTitleValid: false } })
    const { unmount } = render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    expect((screen.getByRole('button', { name: /iniciar serviço/i }) as HTMLButtonElement).disabled).toBe(true)
    unmount()

    montar({ derived: { semFotos: true, isPhoneValid: true, isTitleValid: true } })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    expect((screen.getByRole('button', { name: /iniciar serviço/i }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('serviço em andamento: o botão de concluir aparece, sem foto nenhuma', () => {
    montar({ state: { projetoId: 'p1', projetoStatus: 'em_execucao', titulo: 'Consultoria' }, derived: { semFotos: true, isProjetoPendente: false, isPhoneValid: true, isTitleValid: true } })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    expect(screen.getByRole('button', { name: /marcar como concluído/i })).toBeTruthy()
    expect(screen.getByText('Em andamento')).toBeTruthy()
    expect(screen.queryByText(/tirar ou escolher a foto/i)).toBeNull()
  })

  it('concluído: mostra o resumo e a garantia, sem os passos', () => {
    montar({ state: { projetoId: 'p1', projetoStatus: 'finalizado', titulo: 'Bolo' }, derived: { isProjetoConcluido: true, isProjetoPendente: false } })
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} />)
    expect(screen.getByText('RESUMO-CONCLUIDO')).toBeTruthy()
    expect(screen.getByText('SECAO-GARANTIA')).toBeTruthy()
    expect(screen.getByText('Concluído e avaliado')).toBeTruthy()
    expect(screen.queryByLabelText('Passos do trabalho')).toBeNull()
  })

  it('voltar chama a ação de voltar', () => {
    const onVoltar = vi.fn()
    montar()
    render(<UploadWizardContainer prestadorId={1} onComplete={() => {}} onVoltar={onVoltar} />)
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }))
    expect(onVoltar).toHaveBeenCalledTimes(1)
  })
})
