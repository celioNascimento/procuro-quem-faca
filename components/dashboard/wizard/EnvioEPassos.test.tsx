import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EnvioAoCliente } from '@/components/dashboard/wizard/EnvioAoCliente'
import { PassosDoTrabalho } from '@/components/dashboard/wizard/PassosDoTrabalho'

afterEach(() => { cleanup(); vi.clearAllMocks() })

const props = {
  titulo: 'Enviar o aceite ao cliente',
  explicacao: 'O cliente confirma o início pelo link.',
  rotuloEnviar: 'Enviar o aceite pelo WhatsApp',
  previa: 'Olá, Maria! Registramos o início do serviço.',
}

describe('EnvioAoCliente', () => {
  it('enviar pelo WhatsApp chama a ação', async () => {
    const onEnviar = vi.fn().mockResolvedValue(true)
    render(<EnvioAoCliente {...props} onEnviar={onEnviar} onCopiar={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /enviar o aceite pelo whatsapp/i }))
    await waitFor(() => expect(onEnviar).toHaveBeenCalledTimes(1))
  })

  it('copiar a mensagem confirma na tela (alternativa quando o WhatsApp não abre)', async () => {
    const onCopiar = vi.fn().mockResolvedValue(true)
    render(<EnvioAoCliente {...props} onEnviar={vi.fn()} onCopiar={onCopiar} />)
    fireEvent.click(screen.getByRole('button', { name: /copiar mensagem/i }))
    expect(await screen.findByRole('button', { name: /mensagem copiada/i })).toBeTruthy()
  })

  it('se a cópia falhar, não finge que copiou', async () => {
    const onCopiar = vi.fn().mockResolvedValue(false)
    render(<EnvioAoCliente {...props} onEnviar={vi.fn()} onCopiar={onCopiar} />)
    fireEvent.click(screen.getByRole('button', { name: /copiar mensagem/i }))
    await waitFor(() => expect(onCopiar).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /mensagem copiada/i })).toBeNull()
  })

  it('desabilitado mostra o motivo e não deixa enviar', () => {
    const onEnviar = vi.fn()
    render(<EnvioAoCliente {...props} onEnviar={onEnviar} onCopiar={vi.fn()} desabilitado motivoDesabilitado="Falta confirmar a autorização." />)
    const botao = screen.getByRole('button', { name: /enviar o aceite pelo whatsapp/i }) as HTMLButtonElement
    expect(botao.disabled).toBe(true)
    expect(screen.getByRole('alert').textContent).toMatch(/autorização/)
  })

  it('já enviado: avisa e oferece enviar de novo', () => {
    render(<EnvioAoCliente {...props} onEnviar={vi.fn()} onCopiar={vi.fn()} jaEnviado />)
    expect(screen.getByText(/já enviado/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /enviar de novo pelo whatsapp/i })).toBeTruthy()
  })

  it('mostra a prévia da mensagem que o cliente recebe', () => {
    render(<EnvioAoCliente {...props} onEnviar={vi.fn()} onCopiar={vi.fn()} />)
    expect(screen.getByText(/registramos o início do serviço/i)).toBeTruthy()
  })
})

describe('PassosDoTrabalho', () => {
  it('mostra os passos com o atual marcado e a frase do que fazer agora', () => {
    render(
      <PassosDoTrabalho
        proximaAcao="Envie o aceite ao cliente."
        passos={[
          { id: 'cliente', rotulo: 'Cliente e serviço', estado: 'feito' },
          { id: 'antes', rotulo: 'Foto do antes', estado: 'feito' },
          { id: 'aceite', rotulo: 'Aceite do cliente', estado: 'atual' },
          { id: 'fotos', rotulo: 'Durante e depois', estado: 'pendente' },
        ]}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText(/passo atual/i)).toBeTruthy()
    expect(screen.getByRole('status', { name: /o que fazer agora/i }).textContent).toContain('Envie o aceite ao cliente.')
  })
})
