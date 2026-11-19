import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FeedSwitch } from './FeedSwitch'

afterEach(cleanup)

describe('FeedSwitch', () => {
  it('visível: interruptor ligado e explica onde aparece', () => {
    render(<FeedSwitch projetoId="p1" estado="visivel" onAlternar={() => {}} />)
    expect(screen.getByRole('switch', { name: /Mostrar no feed/i }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText(/Aparece em Trabalhos concluídos/)).toBeTruthy()
  })
  it('oculto: interruptor desligado e avisa que continua no perfil', () => {
    render(<FeedSwitch projetoId="p1" estado="oculto" onAlternar={() => {}} />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText(/Continua no seu perfil/)).toBeTruthy()
  })
  it('tocar chama onAlternar com o id do trabalho', () => {
    const onAlternar = vi.fn()
    render(<FeedSwitch projetoId="p1" estado="visivel" onAlternar={onAlternar} />)
    fireEvent.click(screen.getByTestId('feed-switch-p1'))
    expect(onAlternar).toHaveBeenCalledWith('p1')
  })
})
