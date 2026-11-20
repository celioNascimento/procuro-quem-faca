import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'

const estado = vi.hoisted(() => ({ pendencias: null as Record<string, number> | null }))

vi.mock('@/hooks/admin/useAdminPendencias', () => ({ useAdminPendencias: () => estado.pendencias }))
vi.mock('@/components/Logo', () => ({ default: () => null }))
vi.mock('next/navigation', () => ({ usePathname: () => '/admin' }))

import { AdminSidebar } from '@/components/admin/AdminSidebar'

const zeros = { titular_abertas: 0, titular_atrasadas: 0, denuncias_abertas: 0, selos_cnpj_abertos: 0, selos_documentos_abertos: 0 }

function menu() {
  render(<AdminSidebar isMobileMenuOpen={false} onCloseMobileMenu={() => {}} onLogout={() => {}} />)
}

describe('AdminSidebar: contadores', () => {
  afterEach(() => {
    cleanup()
    estado.pendencias = null
  })

  it('Selos mostra CNPJ e Seguro/CND somados', () => {
    estado.pendencias = { ...zeros, selos_cnpj_abertos: 2, selos_documentos_abertos: 1 }
    menu()
    const selos = screen.getByRole('link', { name: /Selos/ })
    expect(within(selos).getByLabelText('3 pendentes')).toBeTruthy()
  })

  it('Denúncias conta só denúncias', () => {
    estado.pendencias = { ...zeros, denuncias_abertas: 4, selos_cnpj_abertos: 9 }
    menu()
    const denuncias = screen.getByRole('link', { name: /Denúncias/ })
    expect(within(denuncias).getByLabelText('4 pendentes')).toBeTruthy()
  })

  it('sem pendências, nenhum contador aparece', () => {
    estado.pendencias = zeros
    menu()
    expect(screen.queryByLabelText(/pendente/)).toBeNull()
  })

  it('o item se chama apenas "Selos", já que cobre CNPJ e Seguro/CND', () => {
    menu()
    expect(screen.getByRole('link', { name: 'Selos' })).toBeTruthy()
    expect(screen.queryByText('Selos (CNPJ)')).toBeNull()
  })

  it('o menu é organizado por tarefa, na ordem Hoje, Confiança e segurança, Pessoas, Crescimento e Plataforma', () => {
    menu()
    const grupos = ['Hoje', 'Confiança e segurança', 'Pessoas', 'Crescimento', 'Plataforma']
    const textos = grupos.map((g) => screen.getByText(g, { selector: 'p' }))
    for (let i = 1; i < textos.length; i++) {
      expect(textos[i - 1].compareDocumentPosition(textos[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })

  it('usa os nomes novos e leva às mesmas rotas de antes', () => {
    menu()
    const rotas: Record<string, string> = {
      'Visão geral': '/admin',
      'Denúncias': '/admin/moderacao',
      'Selos': '/admin/verificacoes',
      'Pedidos do titular': '/admin/titular',
      'Prestadores': '/admin/prestadores',
      'Convites': '/admin/ativacao',
      'Cliques no WhatsApp': '/admin/cliques',
      'Logs e analytics': '/admin/logs',
      'Catálogo de serviços': '/admin/habilidades',
      'Geografia': '/admin/geografia',
    }
    for (const [nome, href] of Object.entries(rotas)) {
      expect(screen.getByRole('link', { name: nome }).getAttribute('href')).toBe(href)
    }
  })

  it('não tem mais atalhos paralelos nem itens sem uso: Povoar base, Anúncios, Ativação, Pedidos LGPD e Habilidades', () => {
    menu()
    for (const antigo of ['Povoar base', 'Anúncios', 'Ativação', 'Pedidos LGPD', 'Habilidades']) {
      expect(screen.queryByRole('link', { name: antigo })).toBeNull()
    }
  })
})
