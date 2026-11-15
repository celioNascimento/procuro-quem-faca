import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({ oferta: { avaliacaoId: 'av-1' as string | null, carregando: false }, enviar: vi.fn() }))
vi.mock('@/hooks/useOfertaDeReparo', () => ({ useOfertaDeReparo: () => h.oferta }))
vi.mock('@/lib/services/garantia.service', () => ({ oferecerReparoPrestador: (...a: unknown[]) => h.enviar(...a) }))

import { GarantiaOferecerReparo } from './GarantiaOferecerReparo'

const renderiza = (onEnviado = vi.fn()) => ({ onEnviado, ...render(<GarantiaOferecerReparo projetoId="p1" prestadorId={7} onEnviado={onEnviado} />) })
const TEXTO = 'Volto na quarta-feira para refazer o rejunte, sem custo.'

beforeEach(() => { vi.clearAllMocks(); h.oferta = { avaliacaoId: 'av-1', carregando: false } })

describe('GarantiaOferecerReparo', () => {
  it('não aparece se o banco não aceitaria a oferta ou ainda carrega', () => {
    h.oferta = { avaliacaoId: null, carregando: false }
    expect(renderiza().container.firstChild).toBeNull()
  })
  it('não aparece enquanto carrega', () => {
    h.oferta = { avaliacaoId: 'av-1', carregando: true }
    expect(renderiza().container.firstChild).toBeNull()
  })

  it('só envia com 20 caracteres ou mais e manda a avaliação certa', async () => {
    h.enviar.mockResolvedValue({})
    const { onEnviado } = renderiza()
    fireEvent.click(screen.getByRole('button', { name: 'Oferecer reparo' }))
    const botao = screen.getByRole('button', { name: 'Enviar oferta ao cliente' }) as HTMLButtonElement
    expect(botao.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('O que você propõe fazer?'), { target: { value: TEXTO } })
    expect(botao.disabled).toBe(false)
    fireEvent.click(botao)
    await waitFor(() => expect(onEnviado).toHaveBeenCalled())
    expect(h.enviar).toHaveBeenCalledWith({ avaliacaoId: 'av-1', descricaoProblema: TEXTO })
  })

  it('mostra o motivo do banco (em português) e não avança', async () => {
    h.enviar.mockRejectedValue(new Error('Você já ofereceu reparo para esta avaliação.'))
    const { onEnviado } = renderiza()
    fireEvent.click(screen.getByRole('button', { name: 'Oferecer reparo' }))
    fireEvent.change(screen.getByLabelText('O que você propõe fazer?'), { target: { value: TEXTO } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar oferta ao cliente' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Você já ofereceu reparo')
    expect(onEnviado).not.toHaveBeenCalled()
  })

  it('não promete sumiço da avaliação: fala só da nota de 3 estrelas no ranking', () => {
    renderiza()
    expect(document.body.textContent).toMatch(/3 estrelas no seu ranking/)
    expect(document.body.textContent).not.toMatch(/some|oculta|apag/i)
  })
})
