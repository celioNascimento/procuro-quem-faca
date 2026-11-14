import { afterEach, describe, expect, it, vi } from 'vitest'
import { compartilharImagem, enderecoWhatsappComTexto, podeCompartilharImagem } from '@/lib/divulgacao/whatsapp'

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
afterEach(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
  vi.restoreAllMocks()
})
const definirNavigator = (valor: unknown) => Object.defineProperty(globalThis, 'navigator', { value: valor, configurable: true })
const canvasFalso = () => ({ toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/png' })) }) as unknown as HTMLCanvasElement

describe('enderecoWhatsappComTexto', () => {
  it('abre o WhatsApp sem destinatário, com o texto codificado', () => {
    expect(enderecoWhatsappComTexto('Olá! Veja: https://x.com/a?b=1')).toBe('https://wa.me/?text=Ol%C3%A1!%20Veja%3A%20https%3A%2F%2Fx.com%2Fa%3Fb%3D1')
  })
})

describe('compartilhar imagem', () => {
  it('computador, sem compartilhamento de arquivos: não está disponível', async () => {
    definirNavigator({})
    expect(podeCompartilharImagem()).toBe(false)
    expect(await compartilharImagem(canvasFalso(), 'a.png', 'oi')).toBe('indisponivel')
  })

  it('celular: envia o arquivo e o texto pela folha de compartilhar', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    definirNavigator({ share, canShare: () => true })
    expect(podeCompartilharImagem()).toBe(true)
    expect(await compartilharImagem(canvasFalso(), 'cartao.png', 'Conheça meu trabalho')).toBe('enviado')
    const dados = share.mock.calls[0][0]
    expect(dados.text).toBe('Conheça meu trabalho')
    expect(dados.files[0].name).toBe('cartao.png')
    expect(dados.files[0].type).toBe('image/png')
  })

  it('a pessoa fecha a folha de compartilhar: conta como cancelado, não como erro', async () => {
    definirNavigator({ share: vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')), canShare: () => true })
    expect(await compartilharImagem(canvasFalso(), 'a.png', 't')).toBe('cancelado')
  })

  it('falha de outro tipo: indisponível, para a tela cair no plano B', async () => {
    definirNavigator({ share: vi.fn().mockRejectedValue(new Error('boom')), canShare: () => true })
    expect(await compartilharImagem(canvasFalso(), 'a.png', 't')).toBe('indisponivel')
  })
})
