import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePrestadorForm } from './usePrestadorForm'

describe('usePrestadorForm — Instagram', () => {
  it('começa vazio e carrega o usuário guardado como @usuario', () => {
    const { result } = renderHook(() => usePrestadorForm())
    expect(result.current.formData.instagram).toBe('')
    act(() => result.current.carregarPerfil({ nome: 'Pedro', instagram: 'pedro.p' }))
    expect(result.current.formData.instagram).toBe('@pedro.p')
  })
  it('perfil sem Instagram carrega o campo vazio', () => {
    const { result } = renderHook(() => usePrestadorForm())
    act(() => result.current.carregarPerfil({ nome: 'Pedro', instagram: null }))
    expect(result.current.formData.instagram).toBe('')
  })
  it('ao sair do campo, link colado vira @usuario', () => {
    const { result } = renderHook(() => usePrestadorForm())
    act(() => result.current.handleInstagramChange('https://www.instagram.com/Pedro_P/?igsh=x'))
    expect(result.current.formData.instagram).toContain('instagram.com') // enquanto digita, não mexe
    act(() => result.current.handleInstagramBlur())
    expect(result.current.formData.instagram).toBe('@pedro_p')
  })
  it('texto inválido fica como está (o erro aparece no campo); só espaços viram vazio', () => {
    const { result } = renderHook(() => usePrestadorForm())
    act(() => result.current.handleInstagramChange('pedro!!'))
    act(() => result.current.handleInstagramBlur())
    expect(result.current.formData.instagram).toBe('pedro!!')
    act(() => result.current.handleInstagramChange('   '))
    act(() => result.current.handleInstagramBlur())
    expect(result.current.formData.instagram).toBe('')
  })
})
