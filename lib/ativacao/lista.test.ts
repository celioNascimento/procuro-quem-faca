import { describe, expect, it } from 'vitest'
import { correspondeABusca, nomeDoPerfil, NOME_PADRAO } from '@/lib/ativacao/lista'

describe('nomeDoPerfil', () => {
  it('devolve o nome quando existe', () => {
    expect(nomeDoPerfil({ nome: 'Maria Souza' })).toBe('Maria Souza')
  })
  it.each([null, undefined, '', '   '])('perfil sem nome (%j) mostra o texto padrão, sem quebrar', (nome) => {
    expect(nomeDoPerfil({ nome })).toBe(NOME_PADRAO)
  })
})

describe('correspondeABusca', () => {
  it('busca vazia mostra todos, inclusive perfis sem nome e sem slug', () => {
    expect(correspondeABusca({ nome: null, slug: null }, '')).toBe(true)
    expect(correspondeABusca({ nome: 'Ana' }, '   ')).toBe(true)
  })

  it('encontra por parte do nome, sem diferenciar maiúsculas', () => {
    expect(correspondeABusca({ nome: 'TESTE ENSAIO A', slug: 'x' }, 'ensaio')).toBe(true)
    expect(correspondeABusca({ nome: 'Maria', slug: 'maria-eletricista' }, 'MARIA')).toBe(true)
  })

  it('encontra por parte do slug', () => {
    expect(correspondeABusca({ nome: null, slug: 'joao-pedreiro' }, 'pedreiro')).toBe(true)
  })

  it('não encontra quando nada bate', () => {
    expect(correspondeABusca({ nome: 'Maria', slug: 'maria' }, 'carlos')).toBe(false)
  })

  it('perfil sem nome e sem slug não lança erro e só aparece na busca vazia', () => {
    expect(() => correspondeABusca({ nome: null, slug: null }, 'qualquer')).not.toThrow()
    expect(correspondeABusca({ nome: null, slug: null }, 'qualquer')).toBe(false)
  })
})
