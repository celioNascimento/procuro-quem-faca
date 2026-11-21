import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

const nav = vi.hoisted(() => ({ pathname: '/admin/analises', redirect: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname, redirect: nav.redirect }))
vi.mock('@/hooks/useAdminTrafego', () => ({
  useAdminTrafego: () => ({ dias: 30, setDias: vi.fn(), resumo: { buscas: { total: 0, equipe: 0, logados: 0, anonimas: 0 }, visitas_via_busca: { total: 0, equipe: 0, anonimas: 0, perfis_distintos_anonimos: 0 }, dias_suspeitos: 0, visitas_perfil: { total: 0, com_sessao: 0, sem_sessao: 0 } }, leitura: { alertas: [], visitasConfiaveis: 0, buscasDeFora: 0, visitasDeFora: 0 }, carregando: false, erro: null }),
}))

import AnalisesLayout from './layout'
import AnalisesResumoPage from './page'
import CliquesRedirect from '../cliques/page'
import LogsRedirect from '../logs/page'

describe('Análises', () => {
  afterEach(() => { cleanup(); nav.redirect.mockClear() })

  it('tem as três abas e marca a aba aberta', () => {
    nav.pathname = '/admin/analises/cliques'
    render(<AnalisesLayout><p>conteúdo</p></AnalisesLayout>)
    expect(screen.getByRole('heading', { name: 'Análises' })).toBeTruthy()
    const abas = screen.getByRole('navigation', { name: 'Abas de Análises' })
    expect(Array.from(abas.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Resumo', '/admin/analises'],
      ['Cliques', '/admin/analises/cliques'],
      ['Atividade', '/admin/analises/atividade'],
    ])
    expect(screen.getByRole('link', { name: 'Cliques' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Resumo' }).getAttribute('aria-current')).toBeNull()
    expect(screen.getByText('conteúdo')).toBeTruthy()
  })

  it('a aba Resumo mostra o tráfego', () => {
    render(<AnalisesResumoPage />)
    expect(screen.getByTestId('trafego-card')).toBeTruthy()
  })

  it('os endereços antigos levam para as novas abas', () => {
    CliquesRedirect()
    LogsRedirect()
    expect(nav.redirect).toHaveBeenNthCalledWith(1, '/admin/analises/cliques')
    expect(nav.redirect).toHaveBeenNthCalledWith(2, '/admin/analises/atividade')
  })
})
