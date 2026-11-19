import { describe, expect, it } from 'vitest'
import { enderecoDaDenuncia, lerTrabalhoDenunciado, motivoDaDenuncia } from './denuncia'

const ID = '11111111-1111-4111-8111-111111111111'

describe('enderecoDaDenuncia', () => {
  it('leva o prestador no caminho e o trabalho na consulta, com o título codificado', () => {
    expect(enderecoDaDenuncia(7, ID, 'Reforma & pintura')).toBe(`/denunciar/7?trabalho=${ID}&titulo=Reforma%20%26%20pintura`)
  })
  it('corta título longo e tira quebras de linha', () => {
    const url = enderecoDaDenuncia(7, ID, 'a\nb' + 'x'.repeat(200))
    const titulo = new URL('http://x' + url).searchParams.get('titulo') ?? ''
    expect(titulo.length).toBeLessThanOrEqual(100)
    expect(titulo).not.toMatch(/\n/)
  })
})

describe('lerTrabalhoDenunciado', () => {
  const p = (q: string) => new URLSearchParams(q)
  it('lê id e título', () => {
    expect(lerTrabalhoDenunciado(p(`trabalho=${ID}&titulo=Varanda`))).toEqual({ id: ID, titulo: 'Varanda' })
  })
  it('sem trabalho, ou com id adulterado, vira null (denúncia só do prestador)', () => {
    expect(lerTrabalhoDenunciado(p(''))).toBeNull()
    expect(lerTrabalhoDenunciado(p(`trabalho=1' or 1=1&titulo=x`))).toBeNull()
  })
  it('sem título usa um texto padrão', () => {
    expect(lerTrabalhoDenunciado(p(`trabalho=${ID}`))?.titulo).toBe('Trabalho sem título')
  })
})

describe('motivoDaDenuncia', () => {
  it('sem trabalho, só o motivo', () => {
    expect(motivoDaDenuncia('  Foto errada ', null)).toBe('Foto errada')
  })
  it('com trabalho, começa dizendo qual', () => {
    expect(motivoDaDenuncia('Foto errada', { id: ID, titulo: 'Varanda' })).toBe(`Sobre o trabalho "Varanda" (id ${ID}): Foto errada`)
  })
})

describe('motivoDaDenuncia — limites', () => {
  it('corta texto e título longos (o banco recusa mais de 3000 caracteres)', () => {
    const m = motivoDaDenuncia('x'.repeat(5000), { id: 'p1', titulo: 'T'.repeat(500) } as never)
    expect(m.length).toBeLessThanOrEqual(1000 + 120 + 60)
    expect(m.length).toBeLessThan(3000)
  })
})
