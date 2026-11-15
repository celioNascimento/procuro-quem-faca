import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AvisoGarantiaPrestador } from './AvisoGarantiaPrestador'
import type { Projeto } from '@/hooks/usePortfolioDashboard'

const proj = (id: string, casos: { status: string; prazo?: string | null; tipo?: 'garantia' | 'reclamacao' }[]) =>
  ({
    id, titulo: id,
    solicitacoes_garantia: casos.map((c, i) => ({ id: `${id}-${i}`, status: c.status, origem: 'cliente', tipo: c.tipo ?? 'garantia', prazo_resposta: c.prazo ?? null })),
  }) as unknown as Projeto

describe('AvisoGarantiaPrestador', () => {
  it('não aparece sem caso esperando resposta', () => {
    const { container } = render(<AvisoGarantiaPrestador projetos={[proj('a', [{ status: 'respondida' }]), proj('b', [])]} onAbrir={vi.fn()} hoje="2026-11-15" />)
    expect(container.firstChild).toBeNull()
  })

  it('mostra 1 caso com o prazo e abre esse trabalho ao tocar', () => {
    const onAbrir = vi.fn()
    const a = proj('a', [{ status: 'aberta', prazo: '2026-11-18' }])
    render(<AvisoGarantiaPrestador projetos={[a]} onAbrir={onAbrir} hoje="2026-11-15" />)
    expect(screen.getByText('1 caso de garantia esperando sua resposta')).toBeTruthy()
    expect(screen.getByText(/Prazo até 18\/11\. Toque para responder\./)).toBeTruthy()
    fireEvent.click(screen.getByRole('button'))
    expect(onAbrir).toHaveBeenCalledWith(a)
  })

  it('com vários, conta todos e abre o de prazo mais curto', () => {
    const onAbrir = vi.fn()
    const tarde = proj('tarde', [{ status: 'aberta', prazo: '2026-11-25' }])
    const cedo = proj('cedo', [{ status: 'aberta', prazo: '2026-11-16' }])
    render(<AvisoGarantiaPrestador projetos={[tarde, cedo]} onAbrir={onAbrir} hoje="2026-11-15" />)
    expect(screen.getByText('2 casos de garantia esperando sua resposta')).toBeTruthy()
    fireEvent.click(screen.getByRole('button'))
    expect(onAbrir).toHaveBeenCalledWith(cedo)
  })

  it('só reclamações: usa a palavra reclamação', () => {
    render(<AvisoGarantiaPrestador projetos={[proj('a', [{ status: 'aberta', prazo: '2026-11-15', tipo: 'reclamacao' }])]} onAbrir={vi.fn()} hoje="2026-11-15" />)
    expect(screen.getByText('1 reclamação esperando sua resposta')).toBeTruthy()
    expect(screen.getByText(/O prazo termina hoje\./)).toBeTruthy()
  })
})
