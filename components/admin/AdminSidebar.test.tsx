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

  it('Moderação conta só denúncias', () => {
    estado.pendencias = { ...zeros, denuncias_abertas: 4, selos_cnpj_abertos: 9 }
    menu()
    const moderacao = screen.getByRole('link', { name: /Moderação/ })
    expect(within(moderacao).getByLabelText('4 pendentes')).toBeTruthy()
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
})
