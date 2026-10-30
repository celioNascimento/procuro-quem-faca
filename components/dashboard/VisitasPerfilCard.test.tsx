import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ResumoVisitas } from '@/lib/db/resumoVisitas'

const useMinhasVisitas = vi.fn()
vi.mock('@/hooks/useMinhasVisitas', () => ({ useMinhasVisitas: () => useMinhasVisitas() }))

// Permite ligar a exibição de queda sem mexer no código de produção.
const flag = { negativa: false }
vi.mock('@/lib/utils/variacaoVisitas', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils/variacaoVisitas')>()
  return {
    ...original,
    get MOSTRAR_VARIACAO_NEGATIVA() {
      return flag.negativa
    },
  }
})

import { VisitasPerfilCard } from '@/components/dashboard/VisitasPerfilCard'

const base: ResumoVisitas = { visitas7d: 262, visitas7dAnterior: 626, visitas30d: 940, visitas30dAnterior: 353, visitasTotal: 1200 }
const estado = (extra: Partial<{ dados: ResumoVisitas | null; carregando: boolean; erro: boolean }>) =>
  useMinhasVisitas.mockReturnValue({ dados: base, carregando: false, erro: false, ...extra })

beforeEach(() => {
  flag.negativa = false
  useMinhasVisitas.mockReset()
})
afterEach(cleanup)

describe('VisitasPerfilCard', () => {
  it('carregando: mostra o esqueleto com a altura reservada e nenhum número', () => {
    estado({ dados: null, carregando: true })
    const { container } = render(<VisitasPerfilCard />)

    expect(screen.getByRole('status', { name: /carregando visitas/i })).toBeTruthy()
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
  })

  it('erro: mostra a mensagem de falha', () => {
    estado({ dados: null, erro: true })
    render(<VisitasPerfilCard />)
    expect(screen.getByText(/não foi possível carregar as visitas/i)).toBeTruthy()
  })

  it('sem perfil de prestador (dados nulos, sem erro): não renderiza nada', () => {
    estado({ dados: null })
    const { container } = render(<VisitasPerfilCard />)
    expect(container.firstChild).toBeNull()
  })

  it('sem visitas: só a mensagem curta de incentivo, sem números', () => {
    estado({ dados: { visitas7d: 0, visitas7dAnterior: 0, visitas30d: 0, visitas30dAnterior: 0, visitasTotal: 0 } })
    render(<VisitasPerfilCard />)

    expect(screen.getByText(/ainda não teve visitas/i)).toBeTruthy()
    expect(screen.queryByText('Últimos 7 dias')).toBeNull()
  })

  it('com visitas: mostra os três números', () => {
    estado({})
    render(<VisitasPerfilCard />)

    expect(screen.getByText('262')).toBeTruthy()
    expect(screen.getByText('940')).toBeTruthy()
    expect(screen.getByText('1200')).toBeTruthy()
  })

  it('mostra só a variação positiva: +166% nos 30 dias; a queda dos 7 dias fica oculta', () => {
    estado({})
    render(<VisitasPerfilCard />)

    expect(screen.getByText('+166%')).toBeTruthy()
    expect(screen.getByText(/alta de 166% em relação aos 30 dias anteriores/i)).toBeTruthy()
    expect(screen.queryByText(/58/)).toBeNull()
  })

  it('com a exibição negativa ligada, mostra a queda de forma neutra', () => {
    flag.negativa = true
    estado({})
    render(<VisitasPerfilCard />)

    expect(screen.getByText('−58%')).toBeTruthy()
    expect(screen.getByText(/queda de 58% em relação aos 7 dias anteriores/i)).toBeTruthy()
  })

  it('sem base de comparação (período anterior zerado), não mostra variação', () => {
    estado({ dados: { visitas7d: 3, visitas7dAnterior: 0, visitas30d: 3, visitas30dAnterior: 0, visitasTotal: 3 } })
    render(<VisitasPerfilCard />)

    expect(screen.queryByText(/%/)).toBeNull()
  })
})
