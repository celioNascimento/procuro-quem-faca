// components/dashboard/AvaliacaoClienteRapida.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
vi.mock('@/hooks/useAvaliacoes', () => ({ useAvaliacoes: () => ({ avaliacoes: [], stats: { total: 0, media: 0, totalIndica: 0, distribuicao: {} }, loading: false }) }))
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { AvaliacaoClienteRapida } from '@/components/dashboard/AvaliacoesDashboardTab'

describe('AvaliacaoClienteRapida', () => {
  it('só habilita o envio depois de escolher a nota e envia nota e pontos', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<AvaliacaoClienteRapida onSubmit={onSubmit} />)
    const enviar = screen.getByRole('button', { name: /enviar avaliação/i }) as HTMLButtonElement
    expect(enviar.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '4 estrelas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Respeito' }))
    fireEvent.click(enviar)
    expect(onSubmit).toHaveBeenCalledWith(4, ['Respeito'])
  })

  it('aceita no máximo 3 pontos positivos', () => {
    render(<AvaliacaoClienteRapida onSubmit={vi.fn()} />)
    for (const n of ['Comunicação', 'Pontualidade', 'Respeito', 'Organização']) {
      fireEvent.click(screen.getByRole('button', { name: n }))
    }
    expect(screen.getByRole('button', { name: 'Organização' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('avisa que o cliente só vê depois de avaliar', () => {
    render(<AvaliacaoClienteRapida onSubmit={vi.fn()} />)
    expect(document.body.textContent).toMatch(/só vê esta avaliação depois de avaliar/i)
  })

  it('em modo leitura não deixa editar nem enviar', () => {
    render(<AvaliacaoClienteRapida onSubmit={vi.fn()} somenteLeitura notaInicial={5} motivosIniciais={['Respeito']} />)
    expect(screen.queryByRole('button', { name: /enviar avaliação/i })).toBeNull()
    expect((screen.getByRole('button', { name: 'Respeito' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
