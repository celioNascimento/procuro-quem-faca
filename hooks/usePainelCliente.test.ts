import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const push = vi.fn()
const router = { push } // estável, como no Next (senão o efeito do hook reinicia a cada render)
let token: string | null = 'tok-1'
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => ({ get: (k: string) => (k === 'token' ? token : null) }),
}))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: 'cli-1', user_metadata: { full_name: 'Cliente' } } } } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}))
const ordem: string[] = []
const servico = { id: 'p1', status: 'pendente', avaliacao_token: 'tok-1', cliente_nome: 'Cliente', prestadores: { id: 9, user_id: 'prest-1' }, solicitacoes_garantia: [] }
vi.mock('@/lib/services/avaliacao.service', () => ({
  reivindicarProjetoPorToken: vi.fn(async () => { ordem.push('reivindicar'); return 'vinculado' }),
}))
vi.mock('@/lib/services/painelCliente.service', async () => {
  const real = await vi.importActual<typeof import('@/lib/services/painelCliente.service')>('@/lib/services/painelCliente.service')
  return {
    ...real,
    getProfile: vi.fn(async () => ({ full_name: 'Cliente' })),
    getServicoPorToken: vi.fn(async () => { ordem.push('buscar'); return [servico] }),
    getServicosPorUserId: vi.fn(async () => []),
    aceitarServico: vi.fn(),
    recusarServico: vi.fn(),
  }
})

import { usePainelCliente } from '@/hooks/usePainelCliente'
import { aceitarServico } from '@/lib/services/painelCliente.service'
import { AcaoRecusadaError } from '@/lib/services/painelCliente.service'

beforeEach(() => {
  push.mockReset(); ordem.length = 0; token = 'tok-1'
  vi.mocked(aceitarServico).mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('painel do cliente — abrir pelo link', () => {
  it('vincula o cliente ao serviço ANTES de buscar o serviço', async () => {
    const { result } = renderHook(() => usePainelCliente())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(ordem[0]).toBe('reivindicar')
    expect(ordem.indexOf('reivindicar')).toBeLessThan(ordem.indexOf('buscar'))
    expect(result.current.servicos).toHaveLength(1)
  })
})

describe('painel do cliente — Autorizar Serviço', () => {
  it('autorizou: vai para o acompanhamento', async () => {
    vi.mocked(aceitarServico).mockResolvedValue(undefined)
    const { result } = renderHook(() => usePainelCliente())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.handleAceitar(result.current.servicos[0]) })

    expect(aceitarServico).toHaveBeenCalledWith('p1', 'Cliente')
    expect(push).toHaveBeenCalledWith('/acompanhamento/tok-1')
    expect(result.current.erroAcao).toBeNull()
  })

  it('o banco recusou: não fica mudo, explica o motivo e libera o botão', async () => {
    vi.mocked(aceitarServico).mockRejectedValue(new AcaoRecusadaError('nao_e_dono'))
    const { result } = renderHook(() => usePainelCliente())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.handleAceitar(result.current.servicos[0]) })

    expect(push).not.toHaveBeenCalled()
    expect(result.current.erroAcao).toMatch(/outra conta/i)
    expect(result.current.acaoEmAndamento).toBe(false)
  })

  it('trava cliques repetidos enquanto está enviando', async () => {
    let liberar: () => void = () => {}
    vi.mocked(aceitarServico).mockImplementation(() => new Promise<void>(r => { liberar = r }))
    const { result } = renderHook(() => usePainelCliente())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let primeira: Promise<void> = Promise.resolve()
    act(() => { primeira = result.current.handleAceitar(result.current.servicos[0]) })
    await waitFor(() => expect(result.current.acaoEmAndamento).toBe(true))
    await act(async () => { await result.current.handleAceitar(result.current.servicos[0]) })
    expect(aceitarServico).toHaveBeenCalledTimes(1)

    await act(async () => { liberar(); await primeira })
  })
})
