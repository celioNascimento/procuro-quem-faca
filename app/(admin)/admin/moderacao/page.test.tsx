import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

vi.mock('@/hooks/useModeracao', () => ({
  useModeracao: () => ({
    denuncias: [], loading: false, filtro: 'aberta', setFiltro: vi.fn(), processando: false,
    arquivar: vi.fn(), resolverSemBloqueio: vi.fn(), resolverComBloqueio: vi.fn(), desbloquear: vi.fn(),
    motivoBloqueio: {}, atualizarMotivo: vi.fn(),
  }),
}))
vi.mock('@/components/admin/moderacao/DenunciaCard', () => ({ DenunciaCard: () => null }))

import ModeracaoPage from '@/app/(admin)/admin/moderacao/page'

describe('Tela de Denúncias (rota /admin/moderacao)', () => {
  afterEach(() => cleanup())

  it('chama-se "Denúncias", o mesmo nome do menu', () => {
    render(<ModeracaoPage />)
    expect(screen.getByRole('heading', { name: /Denúncias/ })).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/Moderação/)
  })
})
