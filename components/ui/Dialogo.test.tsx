import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DialogoAviso, DialogoConfirmacao } from '@/components/ui/Dialogo'

describe('DialogoConfirmacao', () => {
  function montar(props: Partial<React.ComponentProps<typeof DialogoConfirmacao>> = {}) {
    const onCancelar = vi.fn(); const onConfirmar = vi.fn()
    render(<DialogoConfirmacao aberto titulo="Recusar este trabalho?" mensagem="O prestador será avisado." onCancelar={onCancelar} onConfirmar={onConfirmar} textoConfirmar="Recusar" perigo {...props} />)
    return { onCancelar, onConfirmar }
  }

  it('é um diálogo com nome e descrição', () => {
    montar()
    const d = screen.getByRole('dialog', { name: /recusar este trabalho/i })
    expect(d.getAttribute('aria-modal')).toBe('true')
    expect(d.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('o foco abre no botão seguro (cancelar)', () => {
    montar()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }))
  })

  it('Esc e toque no fundo cancelam; confirmar confirma', () => {
    const { onCancelar, onConfirmar } = montar()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancelar).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onCancelar).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('Tab não sai do diálogo', () => {
    montar()
    const confirmar = screen.getByRole('button', { name: 'Recusar' })
    confirmar.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }))
  })

  it('fechado não renderiza nada e devolve a rolagem da página', () => {
    const { unmount } = render(<DialogoConfirmacao aberto titulo="x" mensagem="y" onCancelar={() => {}} onConfirmar={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
    render(<DialogoConfirmacao aberto={false} titulo="x" mensagem="y" onCancelar={() => {}} onConfirmar={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('DialogoAviso', () => {
  it('fecha pelo botão e por Esc', () => {
    const onFechar = vi.fn()
    render(<DialogoAviso aberto titulo="Telefone inválido" mensagem="O WhatsApp precisa ter 10 ou 11 dígitos." onFechar={onFechar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onFechar).toHaveBeenCalledTimes(2)
  })
})
