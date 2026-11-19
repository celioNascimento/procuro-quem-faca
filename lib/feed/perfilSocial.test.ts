import { describe, expect, it } from 'vitest'
import { aplicarCurtidaNoPerfil, aplicarSalvoNoPerfil, aplicarSeguirNoPerfil, normalizarPerfilSocial, textoSeguidores, type PerfilSocial } from './perfilSocial'

const base: PerfilSocial = { totalSeguidores: 3, seguindo: false, meuPerfil: false, curtidas: { a: { total: 2, curtidoPorMim: false, salvoPorMim: false } } }

describe('normalizarPerfilSocial', () => {
  it('converte o que vem do banco', () => {
    expect(normalizarPerfilSocial({
      total_seguidores: 12, seguindo: true, meu_perfil: false,
      curtidas: { a: { total: 4, curtido_por_mim: true, salvo_por_mim: true }, b: { total: 0, curtido_por_mim: false } },
    })).toEqual({ totalSeguidores: 12, seguindo: true, meuPerfil: false, curtidas: { a: { total: 4, curtidoPorMim: true, salvoPorMim: true }, b: { total: 0, curtidoPorMim: false, salvoPorMim: false } } })
  })
  it('null, lixo ou lista viram null (a tela não mostra curtir/seguir)', () => {
    expect(normalizarPerfilSocial(null)).toBeNull()
    expect(normalizarPerfilSocial('x')).toBeNull()
    expect(normalizarPerfilSocial([])).toBeNull()
  })
  it('campos ausentes ou inválidos viram zero/falso, nunca negativo', () => {
    expect(normalizarPerfilSocial({ total_seguidores: -5, curtidas: { a: { total: 'x' } } })).toEqual({
      totalSeguidores: 0, seguindo: false, meuPerfil: false, curtidas: { a: { total: 0, curtidoPorMim: false, salvoPorMim: false } },
    })
  })
})

describe('textos e atualizações do perfil', () => {
  it('textoSeguidores: zero não mostra número', () => {
    expect(textoSeguidores(0)).toBe('')
    expect(textoSeguidores(1)).toBe('1 seguidor')
    expect(textoSeguidores(12)).toBe('12 seguidores')
  })
  it('aplicarSeguirNoPerfil soma e subtrai, sem passar de zero e sem contar duas vezes', () => {
    expect(aplicarSeguirNoPerfil(base, true)).toMatchObject({ seguindo: true, totalSeguidores: 4 })
    expect(aplicarSeguirNoPerfil({ ...base, seguindo: true }, false)).toMatchObject({ seguindo: false, totalSeguidores: 2 })
    expect(aplicarSeguirNoPerfil({ ...base, seguindo: true, totalSeguidores: 0 }, false).totalSeguidores).toBe(0)
    expect(aplicarSeguirNoPerfil(base, false)).toBe(base)
  })
  it('aplicarCurtidaNoPerfil só mexe no trabalho certo', () => {
    const r = aplicarCurtidaNoPerfil(base, 'b', true, 1)
    expect(r.curtidas).toEqual({ a: { total: 2, curtidoPorMim: false, salvoPorMim: false }, b: { total: 1, curtidoPorMim: true, salvoPorMim: false } })
  })
  it('curtir não apaga o "salvo" do mesmo trabalho', () => {
    const salvo = { ...base, curtidas: { a: { total: 2, curtidoPorMim: false, salvoPorMim: true } } }
    expect(aplicarCurtidaNoPerfil(salvo, 'a', true, 3).curtidas.a).toEqual({ total: 3, curtidoPorMim: true, salvoPorMim: true })
  })
  it('aplicarSalvoNoPerfil mexe só no salvo e não nas curtidas; trabalho novo começa zerado', () => {
    expect(aplicarSalvoNoPerfil(base, 'a', true).curtidas.a).toEqual({ total: 2, curtidoPorMim: false, salvoPorMim: true })
    expect(aplicarSalvoNoPerfil(base, 'z', true).curtidas.z).toEqual({ total: 0, curtidoPorMim: false, salvoPorMim: true })
    expect(aplicarSalvoNoPerfil(base, 'a', true)).not.toBe(base)
  })
})
