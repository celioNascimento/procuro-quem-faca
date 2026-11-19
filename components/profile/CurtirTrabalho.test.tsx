import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CurtirTrabalho } from './CurtirTrabalho'

afterEach(cleanup)

describe('CurtirTrabalho', () => {
  it('sem curtidas mostra "Curtir"; com curtidas mostra o número', () => {
    const { rerender } = render(<CurtirTrabalho total={0} curtido={false} onCurtir={() => {}} />)
    expect(screen.getByTestId('modal-curtidas-texto').textContent).toBe('Curtir')
    rerender(<CurtirTrabalho total={5} curtido={false} onCurtir={() => {}} />)
    expect(screen.getByTestId('modal-curtidas-texto').textContent).toBe('5')
  })
  it('curtido: botão marcado e nome muda para Descurtir', () => {
    render(<CurtirTrabalho total={5} curtido onCurtir={() => {}} />)
    const b = screen.getByRole('button', { name: /Descurtir este trabalho/ })
    expect(b.getAttribute('aria-pressed')).toBe('true')
  })
  it('tocar chama onCurtir', () => {
    const onCurtir = vi.fn()
    render(<CurtirTrabalho total={0} curtido={false} onCurtir={onCurtir} />)
    fireEvent.click(screen.getByTestId('modal-curtir'))
    expect(onCurtir).toHaveBeenCalledTimes(1)
  })
})
