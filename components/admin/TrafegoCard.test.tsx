import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TrafegoCard } from './TrafegoCard'
import { lerTrafego, RESUMO_VAZIO, type ResumoTrafego } from '@/lib/admin/trafego'

afterEach(cleanup)

const resumo: ResumoTrafego = {
  ...RESUMO_VAZIO,
  buscas: { total: 100, equipe: 40, logados: 10, anonimas: 50 },
  visitas_via_busca: { total: 200, equipe: 5, anonimas: 190, perfis_distintos_anonimos: 150 },
  dias_suspeitos: 2,
  visitas_perfil: { total: 60, com_sessao: 40, sem_sessao: 20 },
}

describe('TrafegoCard', () => {
  it('mostra os alertas e os números separados', () => {
    render(<TrafegoCard dias={30} onDias={vi.fn()} resumo={resumo} leitura={lerTrafego(resumo)} carregando={false} erro={null} />)
    expect(screen.getByTestId('trafego-alertas').textContent).toMatch(/robô/)
    expect(screen.getByText('Visitas a perfis confiáveis').closest('div')?.parentElement?.textContent).toContain('40')
    expect(screen.getByText(/40% das buscas/)).toBeTruthy()
  })
  it('troca o período e mostra erro sem quebrar', () => {
    const onDias = vi.fn()
    render(<TrafegoCard dias={30} onDias={onDias} resumo={RESUMO_VAZIO} leitura={lerTrafego(RESUMO_VAZIO)} carregando={false} erro="Falhou" />)
    fireEvent.click(screen.getByRole('button', { name: '7 dias' }))
    expect(onDias).toHaveBeenCalledWith(7)
    expect(screen.getByRole('alert').textContent).toBe('Falhou')
    expect(screen.queryByTestId('trafego-alertas')).toBeNull()
  })
})
