import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'

const servico = vi.hoisted(() => ({ fetchClienteProfile: vi.fn() }))
vi.mock('@/lib/services/cliente.service', () => servico)

import { useAvatarConta } from '@/hooks/useAvatarConta'

describe('useAvatarConta', () => {
  afterEach(() => {
    cleanup()
    servico.fetchClienteProfile.mockReset()
  })

  it('começa na foto do Google e troca pela foto enviada no perfil quando ela carrega', async () => {
    servico.fetchClienteProfile.mockResolvedValue({ avatar_url: 'https://pqf/foto.jpg' })
    const { result } = renderHook(() => useAvatarConta('u1', { picture: 'https://g/p.jpg' }))
    expect(result.current).toBe('https://g/p.jpg')
    await waitFor(() => expect(result.current).toBe('https://pqf/foto.jpg'))
  })

  it('se o perfil não carrega, continua com a foto do Google', async () => {
    servico.fetchClienteProfile.mockRejectedValue(new Error('falhou'))
    const { result } = renderHook(() => useAvatarConta('u1', { avatar_url: 'https://g/a.jpg' }))
    await waitFor(() => expect(servico.fetchClienteProfile).toHaveBeenCalled())
    expect(result.current).toBe('https://g/a.jpg')
  })

  it('sem usuário logado, não consulta o perfil', () => {
    const { result } = renderHook(() => useAvatarConta(undefined, undefined))
    expect(servico.fetchClienteProfile).not.toHaveBeenCalled()
    expect(result.current).toBe('')
  })
})
