// hooks/useAoTrocarCidadeSalva.test.ts
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAoTrocarCidadeSalva } from '@/hooks/useAoTrocarCidadeSalva'

describe('useAoTrocarCidadeSalva', () => {
  it('avisa quando a cidade salva muda de uma para outra', () => {
    const aoTrocar = vi.fn()
    const { rerender } = renderHook(({ id }) => useAoTrocarCidadeSalva(id, aoTrocar), { initialProps: { id: 'londrina' as string | undefined } })
    expect(aoTrocar).not.toHaveBeenCalled()
    rerender({ id: 'nova-aurora' })
    expect(aoTrocar).toHaveBeenCalledTimes(1)
  })

  it('não avisa na primeira escolha (não havia cidade salva antes)', () => {
    const aoTrocar = vi.fn()
    const { rerender } = renderHook(({ id }) => useAoTrocarCidadeSalva(id, aoTrocar), { initialProps: { id: undefined as string | undefined } })
    rerender({ id: 'londrina' })
    expect(aoTrocar).not.toHaveBeenCalled()
  })

  it('não avisa se a cidade continua a mesma, mesmo com a função trocando a cada renderização', () => {
    const aoTrocar = vi.fn()
    const { rerender } = renderHook(({ id }) => useAoTrocarCidadeSalva(id, () => aoTrocar()), { initialProps: { id: 'londrina' as string | undefined } })
    rerender({ id: 'londrina' })
    rerender({ id: 'londrina' })
    expect(aoTrocar).not.toHaveBeenCalled()
  })
})
