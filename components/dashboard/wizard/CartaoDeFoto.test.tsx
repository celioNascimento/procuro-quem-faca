import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CartaoDeFoto } from '@/components/dashboard/wizard/CartaoDeFoto'

const base = {
  etapa: 3 as const,
  fotoUrl: 'https://exemplo.com/foto.png',
  descricaoInicial: '',
  exemploDaCategoria: 'Bolo de dois andares com recheio de brigadeiro para 40 pessoas.',
  bloqueada: false,
  motivoBloqueio: 'Envie o aceite ao cliente para liberar esta foto.',
  enviando: false,
  contemPessoas: false,
  autorizado: false,
  onEscolherArquivo: vi.fn(),
  onSalvarDescricao: vi.fn().mockResolvedValue(true),
  onAutorizacao: vi.fn().mockResolvedValue(true),
  onAmpliar: vi.fn(),
}

afterEach(() => { cleanup(); vi.clearAllMocks(); base.onSalvarDescricao.mockResolvedValue(true); base.onAutorizacao.mockResolvedValue(true) })

describe('CartaoDeFoto', () => {
  it('o exemplo do campo "Depois" é o da categoria do prestador, não de outro ofício', () => {
    render(<CartaoDeFoto {...base} />)
    const campo = screen.getByLabelText(/descrição \(opcional\)/i) as HTMLTextAreaElement
    expect(campo.placeholder).toBe('Ex.: Bolo de dois andares com recheio de brigadeiro para 40 pessoas.')
    expect(campo.placeholder).not.toMatch(/fiação/i)
  })

  it('categoria sem exemplo mostra a frase neutra', () => {
    render(<CartaoDeFoto {...base} exemploDaCategoria={null} />)
    expect((screen.getByLabelText(/descrição \(opcional\)/i) as HTMLTextAreaElement).placeholder).toBe('Conte em uma frase o que foi feito.')
  })

  it('Antes e Durante usam convites neutros', () => {
    const { unmount } = render(<CartaoDeFoto {...base} etapa={1} />)
    expect((screen.getByLabelText(/descrição \(opcional\)/i) as HTMLTextAreaElement).placeholder).toBe('Como estava antes de começar?')
    unmount()
    render(<CartaoDeFoto {...base} etapa={2} />)
    expect((screen.getByLabelText(/descrição \(opcional\)/i) as HTMLTextAreaElement).placeholder).toBe('O que está sendo feito?')
  })

  it('a descrição é opcional: salva ao sair do campo e confirma', async () => {
    render(<CartaoDeFoto {...base} />)
    const campo = screen.getByLabelText(/descrição \(opcional\)/i)
    fireEvent.change(campo, { target: { value: 'Bolo de aniversário' } })
    fireEvent.blur(campo)
    await waitFor(() => expect(base.onSalvarDescricao).toHaveBeenCalledWith('Bolo de aniversário'))
    expect(await screen.findByText('Descrição salva.')).toBeTruthy()
  })

  it('sair do campo sem mudar nada não grava de novo', () => {
    render(<CartaoDeFoto {...base} descricaoInicial="Já escrita" />)
    fireEvent.blur(screen.getByLabelText(/descrição \(opcional\)/i))
    expect(base.onSalvarDescricao).not.toHaveBeenCalled()
  })

  it('falha ao salvar a descrição avisa em linguagem simples', async () => {
    base.onSalvarDescricao.mockResolvedValue(false)
    render(<CartaoDeFoto {...base} />)
    const campo = screen.getByLabelText(/descrição \(opcional\)/i)
    fireEvent.change(campo, { target: { value: 'texto' } })
    fireEvent.blur(campo)
    expect(await screen.findByText(/não foi possível salvar/i)).toBeTruthy()
  })

  it('foto bloqueada mostra o motivo, sem campo de envio', () => {
    render(<CartaoDeFoto {...base} fotoUrl={null} bloqueada />)
    expect(screen.getByText(/envie o aceite ao cliente/i)).toBeTruthy()
    expect(screen.queryByText(/tirar ou escolher a foto/i)).toBeNull()
  })

  it('sem foto e liberada: convida a tirar ou escolher a foto', () => {
    render(<CartaoDeFoto {...base} fotoUrl={null} />)
    expect(screen.getByText(/tirar ou escolher a foto/i)).toBeTruthy()
  })

  it('marcar que aparece uma pessoa pede a autorização e avisa que o envio fica bloqueado', async () => {
    const { rerender } = render(<CartaoDeFoto {...base} />)
    fireEvent.click(screen.getByLabelText(/aparece o rosto de alguma pessoa/i))
    await waitFor(() => expect(base.onAutorizacao).toHaveBeenCalledWith(true, false))

    rerender(<CartaoDeFoto {...base} contemPessoas autorizado={false} />)
    expect(screen.getByText(/tenho a autorização dessa pessoa/i)).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toMatch(/envio ao cliente fica bloqueado/i)
  })

  it('confirmar a autorização remove o aviso', async () => {
    render(<CartaoDeFoto {...base} contemPessoas autorizado={false} />)
    fireEvent.click(screen.getByLabelText(/tenho a autorização dessa pessoa/i))
    await waitFor(() => expect(base.onAutorizacao).toHaveBeenCalledWith(true, true))
    cleanup()
    render(<CartaoDeFoto {...base} contemPessoas autorizado />)
    expect(screen.queryByText(/envio ao cliente fica bloqueado/i)).toBeNull()
  })

  it('ampliar a foto chama a ação', () => {
    render(<CartaoDeFoto {...base} />)
    fireEvent.click(screen.getByRole('button', { name: /ampliar/i }))
    expect(base.onAmpliar).toHaveBeenCalledTimes(1)
  })
})
