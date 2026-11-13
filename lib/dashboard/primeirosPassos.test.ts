import { describe, expect, it } from 'vitest'
import { listarPassos, todosConcluidos, totalConcluidos } from '@/lib/dashboard/primeirosPassos'

describe('listarPassos', () => {
  it('perfil recém-criado: só o primeiro passo está concluído', () => {
    const passos = listarPassos({ temFotosNaVitrine: false, temTrabalhos: false })
    expect(passos.map((p) => p.id)).toEqual(['perfil', 'vitrine', 'trabalho'])
    expect(passos.map((p) => p.concluido)).toEqual([true, false, false])
    expect(totalConcluidos(passos)).toBe(1)
    expect(todosConcluidos(passos)).toBe(false)
  })

  it('fotos na vitrine concluem o segundo passo, sem concluir o terceiro', () => {
    const passos = listarPassos({ temFotosNaVitrine: true, temTrabalhos: false })
    expect(passos.map((p) => p.concluido)).toEqual([true, true, false])
  })

  it('um trabalho registrado conclui o terceiro passo, mesmo sem vitrine', () => {
    const passos = listarPassos({ temFotosNaVitrine: false, temTrabalhos: true })
    expect(passos.map((p) => p.concluido)).toEqual([true, false, true])
  })

  it('com vitrine e trabalho, tudo concluído', () => {
    const passos = listarPassos({ temFotosNaVitrine: true, temTrabalhos: true })
    expect(todosConcluidos(passos)).toBe(true)
    expect(totalConcluidos(passos)).toBe(3)
  })

  it('o passo do trabalho explica o ciclo com o cliente', () => {
    const trabalho = listarPassos({ temFotosNaVitrine: false, temTrabalhos: false })[2]
    expect(trabalho.descricao).toMatch(/aceita/i)
    expect(trabalho.descricao).toMatch(/avalia/i)
  })
})
