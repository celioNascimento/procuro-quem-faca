import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ResumoVisitas } from '@/lib/db/resumoVisitas'
import type { MeusCliques } from '@/hooks/useMeusCliques'

const useMinhasVisitas = vi.fn()
const useMeusCliques = vi.fn()
vi.mock('@/hooks/useMinhasVisitas', () => ({ useMinhasVisitas: () => useMinhasVisitas() }))
vi.mock('@/hooks/useMeusCliques', () => ({ useMeusCliques: () => useMeusCliques() }))

import { ResumoDesempenhoStrip } from '@/components/dashboard/ResumoDesempenhoStrip'

const visitasBase: ResumoVisitas = { visitas7d: 12, visitas7dAnterior: 5, visitas30d: 40, visitas30dAnterior: 30, visitasTotal: 90 }
const cliquesBase: MeusCliques = { rastreando: true, ultimos7: 3, ultimos30: 8, total: 20 }

const estadoVisitas = (extra: Partial<{ dados: ResumoVisitas | null; carregando: boolean; erro: boolean }> = {}) =>
  useMinhasVisitas.mockReturnValue({ dados: visitasBase, carregando: false, erro: false, ...extra })
const estadoCliques = (extra: Partial<{ dados: MeusCliques | null; carregando: boolean; erro: boolean }> = {}) =>
  useMeusCliques.mockReturnValue({ dados: cliquesBase, carregando: false, erro: false, ...extra })

beforeEach(() => {
  useMinhasVisitas.mockReset()
  useMeusCliques.mockReset()
  estadoVisitas()
  estadoCliques()
})
afterEach(cleanup)

describe('ResumoDesempenhoStrip', () => {
  it('mostra visitas e contatos dos últimos 7 dias', () => {
    render(<ResumoDesempenhoStrip onAbrir={() => {}} />)

    const botao = screen.getByRole('button', { name: /ver desempenho completo/i })
    expect(botao.textContent).toContain('12')
    expect(botao.textContent).toContain('3')
    expect(botao.getAttribute('aria-label')).toMatch(/12 visitas e 3 contatos pelo WhatsApp/i)
  })

  it('carregando: mostra traços no lugar dos números', () => {
    estadoVisitas({ dados: null, carregando: true })
    estadoCliques({ dados: null, carregando: true })
    render(<ResumoDesempenhoStrip onAbrir={() => {}} />)

    expect(screen.getByRole('button', { name: /ver desempenho completo/i }).textContent).toContain('—')
  })

  it('contagem de cliques ainda não ativa: não inventa zero para os contatos', () => {
    estadoCliques({ dados: { rastreando: false } })
    render(<ResumoDesempenhoStrip onAbrir={() => {}} />)

    const botao = screen.getByRole('button', { name: /ver desempenho completo/i })
    expect(botao.textContent).toContain('12')
    expect(botao.textContent).toContain('—')
  })

  it('perfil novo, sem visita nem contato: a faixa não aparece zerada', () => {
    estadoVisitas({ dados: { ...visitasBase, visitas7d: 0 } })
    estadoCliques({ dados: { rastreando: true, ultimos7: 0, ultimos30: 0, total: 0 } })
    const { container } = render(<ResumoDesempenhoStrip onAbrir={() => {}} />)

    expect(container.firstChild).toBeNull()
  })

  it('com ao menos uma visita, a faixa aparece mesmo sem contatos', () => {
    estadoVisitas({ dados: { ...visitasBase, visitas7d: 1 } })
    estadoCliques({ dados: { rastreando: true, ultimos7: 0, ultimos30: 0, total: 0 } })
    render(<ResumoDesempenhoStrip onAbrir={() => {}} />)

    expect(screen.getByRole('button', { name: /ver desempenho completo/i })).toBeTruthy()
  })

  it('sem prestador vinculado: não renderiza nada', () => {
    estadoVisitas({ dados: null })
    const { container } = render(<ResumoDesempenhoStrip onAbrir={() => {}} />)

    expect(container.firstChild).toBeNull()
  })

  it('clicar chama onAbrir', () => {
    const onAbrir = vi.fn()
    render(<ResumoDesempenhoStrip onAbrir={onAbrir} />)

    fireEvent.click(screen.getByRole('button', { name: /ver desempenho completo/i }))
    expect(onAbrir).toHaveBeenCalledTimes(1)
  })
})
