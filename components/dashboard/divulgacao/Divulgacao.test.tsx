import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { DadosDivulgacao } from '@/lib/divulgacao/tipos'

const registrar = vi.fn()
vi.mock('@/lib/services/divulgacao.service', () => ({ registrarUsoDivulgacao: (...a: unknown[]) => registrar(...a) }))
vi.mock('@/lib/divulgacao/download', () => ({ baixarCanvas: vi.fn().mockResolvedValue(undefined), copiarTexto: vi.fn().mockResolvedValue(true), imprimirArtes: vi.fn() }))
vi.mock('@/lib/divulgacao/canvas', () => ({
  TAMANHOS_CARTAO: { '1:1': { largura: 1080, altura: 1080, rotulo: 'Quadrado', uso: 'Chat' }, '4:3': { largura: 1200, altura: 900, rotulo: 'Retrato', uso: 'Chat' }, '9:16': { largura: 1080, altura: 1920, rotulo: 'Stories', uso: 'Status' } },
  desenharCartaoDigital: vi.fn(),
}))
vi.mock('@/components/dashboard/divulgacao/CanvasPreview', () => ({
  CanvasPreview: ({ onCanvas }: { onCanvas?: (c: HTMLCanvasElement | null) => void }) => {
    onCanvas?.(document.createElement('canvas'))
    return <div>PREVIA</div>
  },
}))
const kit = vi.fn()
vi.mock('@/hooks/useKitDivulgacao', () => ({ useKitDivulgacao: () => kit() }))
vi.mock('@/components/help/HelpCenter', () => ({ ContextualHelp: () => null }))
vi.mock('@/components/dashboard/divulgacao/MaterialFisicoPanel', () => ({ MaterialFisicoPanel: () => <div>FISICO</div> }))

import { LinksPanel } from '@/components/dashboard/divulgacao/LinksPanel'
import { CartaoDigitalPanel } from '@/components/dashboard/divulgacao/CartaoDigitalPanel'
import CentralDivulgacaoTab from '@/components/dashboard/CentralDivulgacaoTab'
import { baixarCanvas } from '@/lib/divulgacao/download'

const completo: DadosDivulgacao = {
  id: 7, nome: 'Elétrica Silva', slug: 'eletrica-silva', categoria: 'Eletricista', cidade: 'Londrina', verificado: true,
  whatsapp: '43999998888', fotoPerfilUrl: null, totalIndicacoes: 5, totalConcluidos: 3, garantiaDias: 30, fotosPortfolio: ['https://x/1.png'],
}
const vazio: DadosDivulgacao = { ...completo, totalIndicacoes: 0, totalConcluidos: 0, garantiaDias: 0, fotosPortfolio: [] }
const imagens = { logoPqf: null, perfil: null, fotos: [] }

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
beforeEach(() => { registrar.mockReset(); kit.mockReset() })
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
})

describe('LinksPanel — enviar pelo WhatsApp', () => {
  it('cada mensagem tem um botão que abre o WhatsApp com o texto dela', () => {
    render(<LinksPanel dados={completo} />)
    const botoes = screen.getAllByRole('link', { name: /enviar no whatsapp/i })
    expect(botoes).toHaveLength(4)
    for (const b of botoes) {
      const href = b.getAttribute('href') ?? ''
      expect(href.startsWith('https://wa.me/?text=')).toBe(true)
      expect(decodeURIComponent(href)).toContain('https://procuroquemfaca.com.br/eletrica-silva')
      expect(b.getAttribute('target')).toBe('_blank')
      expect(b.getAttribute('rel')).toContain('noopener')
    }
  })

  it('o link geral da vitrine também pode ser enviado direto', () => {
    render(<LinksPanel dados={completo} />)
    const b = screen.getByRole('link', { name: /enviar o link no whatsapp/i })
    expect(decodeURIComponent(b.getAttribute('href') ?? '')).toContain('Conheça meu trabalho: https://procuroquemfaca.com.br/eletrica-silva')
  })

  it('registra o uso quando a pessoa toca em enviar', () => {
    render(<LinksPanel dados={completo} />)
    const b = screen.getAllByRole('link', { name: /enviar no whatsapp/i })[0]
    b.addEventListener('click', e => e.preventDefault())
    fireEvent.click(b)
    expect(registrar).toHaveBeenCalledWith(7, 'COMPARTILHAR_WHATSAPP_DIVULGACAO', 'portfolio')
  })

  it('sem portfólio nem indicações, nenhuma mensagem fala em fotos ou portfólio', () => {
    render(<LinksPanel dados={vazio} />)
    const textos = screen.getAllByText(/Olá|Profissional|Pessoal/).map(e => e.textContent).join(' ')
    expect(textos).not.toMatch(/portf[óo]lio|fotos/i)
  })
})

describe('CartaoDigitalPanel — enviar pelo WhatsApp', () => {
  it('computador: abre o WhatsApp com o link e baixa a imagem para anexar', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true })
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<CartaoDigitalPanel dados={completo} imagens={imagens} />)

    fireEvent.click(screen.getByRole('button', { name: /enviar pelo whatsapp/i }))

    expect(abrir).toHaveBeenCalledTimes(1)
    expect(decodeURIComponent(String(abrir.mock.calls[0][0]))).toContain('https://procuroquemfaca.com.br/eletrica-silva')
    await waitFor(() => expect(baixarCanvas).toHaveBeenCalled())
    expect((await screen.findByRole('status')).textContent).toMatch(/anexe a imagem/i)
    expect(registrar).toHaveBeenCalledWith(7, 'COMPARTILHAR_WHATSAPP_DIVULGACAO', 'cartao_1:1')
  })

  it('celular: usa a folha de compartilhar do aparelho, sem abrir outra janela', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis, 'navigator', { value: { share, canShare: () => true }, configurable: true })
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null)
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(cb => cb(new Blob(['x'], { type: 'image/png' })))
    render(<CartaoDigitalPanel dados={completo} imagens={imagens} />)

    fireEvent.click(screen.getByRole('button', { name: /enviar pelo whatsapp/i }))

    await waitFor(() => expect(share).toHaveBeenCalled())
    expect(share.mock.calls[0][0].files[0].type).toBe('image/png')
    expect(abrir).not.toHaveBeenCalled()
    toBlob.mockRestore()
  })

  it('sem portfólio, o texto explica que a foto do serviço entra depois', () => {
    render(<CartaoDigitalPanel dados={vazio} imagens={imagens} />)
    expect(screen.getByText(/quando você tiver um trabalho concluído/i)).toBeTruthy()
  })
})

describe('CentralDivulgacaoTab — prestador sem trabalhos', () => {
  const estado = (dados: DadosDivulgacao) => kit.mockReturnValue({ dados, imagens, loading: false, erro: false })

  it('mostra o aviso com o botão que leva ao primeiro trabalho', () => {
    estado(vazio)
    const ir = vi.fn()
    render(<CentralDivulgacaoTab prestadorId={7} onIrParaTrabalhos={ir} />)

    expect(screen.getByText(/seus materiais já estão prontos para usar/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /registrar um trabalho/i }))
    expect(ir).toHaveBeenCalled()
  })

  it('com trabalho concluído, o aviso não aparece', () => {
    estado(completo)
    render(<CentralDivulgacaoTab prestadorId={7} onIrParaTrabalhos={() => {}} />)
    expect(screen.queryByText(/seus materiais já estão prontos/i)).toBeNull()
  })

  it('a aba de links não fala em orçamento', () => {
    estado(completo)
    render(<CentralDivulgacaoTab prestadorId={7} />)
    expect(screen.getByRole('tab', { name: /links & mensagens/i })).toBeTruthy()
    expect(screen.queryByText(/orçamento/i)).toBeNull()
  })
})
