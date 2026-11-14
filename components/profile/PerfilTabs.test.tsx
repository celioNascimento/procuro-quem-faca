// components/profile/PerfilTabs.test.tsx
// O modal do trabalho vive na URL (?projeto=). Abrir empilha uma entrada; fechar tem de desfazê-la,
// senão o "voltar" do celular reabre o modal em vez de ir para a busca.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() }
let parametros = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/celio-teste',
  useSearchParams: () => parametros,
}))
vi.mock('@/components/profile/PortfolioGrid', () => ({
  default: ({ onAbrirProjeto }: { onAbrirProjeto: (id: number) => void }) => (
    <button onClick={() => onAbrirProjeto(7)}>Abrir trabalho</button>
  ),
}))
vi.mock('@/components/profile/PerfilAvaliacoes', () => ({ default: () => null }))
vi.mock('@/components/profile/ProjetoModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>Fechar modal</button>,
}))

import PerfilTabs from '@/components/profile/PerfilTabs'
import type { ProjetoPerfil } from '@/types/perfil'

const projetos = [{ id: 7, titulo: 'Reforma', portfolio_fotos: [], avaliacoes: [] }] as unknown as ProjetoPerfil[]

describe('PerfilTabs — voltar com o modal do trabalho', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    parametros = new URLSearchParams()
  })

  it('abrir põe ?projeto= na URL com push', () => {
    render(<PerfilTabs projetos={projetos} avaliacoes={[]} />)
    fireEvent.click(screen.getByText('Abrir trabalho'))
    expect(router.push).toHaveBeenCalledWith('/celio-teste?projeto=7', { scroll: false })
  })

  it('fechar um modal aberto por toque DESFAZ a entrada (back), sem empilhar outra', () => {
    const { rerender } = render(<PerfilTabs projetos={projetos} avaliacoes={[]} />)
    fireEvent.click(screen.getByText('Abrir trabalho'))
    parametros = new URLSearchParams('projeto=7')
    rerender(<PerfilTabs projetos={projetos} avaliacoes={[]} />)

    fireEvent.click(screen.getByText('Fechar modal'))
    expect(router.back).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledTimes(1) // só o push da abertura
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('modal aberto por link direto (?projeto= já na URL) fecha só limpando a URL', () => {
    parametros = new URLSearchParams('projeto=7')
    render(<PerfilTabs projetos={projetos} avaliacoes={[]} />)

    fireEvent.click(screen.getByText('Fechar modal'))
    expect(router.replace).toHaveBeenCalledWith('/celio-teste', { scroll: false })
    expect(router.back).not.toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('depois de fechar por link direto, um toque novo volta a funcionar como toque', () => {
    parametros = new URLSearchParams('projeto=7')
    const { rerender } = render(<PerfilTabs projetos={projetos} avaliacoes={[]} />)
    fireEvent.click(screen.getByText('Fechar modal'))
    parametros = new URLSearchParams()
    rerender(<PerfilTabs projetos={projetos} avaliacoes={[]} />)

    fireEvent.click(screen.getByText('Abrir trabalho'))
    parametros = new URLSearchParams('projeto=7')
    rerender(<PerfilTabs projetos={projetos} avaliacoes={[]} />)
    fireEvent.click(screen.getByText('Fechar modal'))
    expect(router.back).toHaveBeenCalledTimes(1)
  })
})
