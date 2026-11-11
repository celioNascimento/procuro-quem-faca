import { describe, expect, it } from 'vitest'
import { achatarAtivacao, correspondeABusca, nomeDoPerfil, NOME_PADRAO } from '@/lib/ativacao/lista'

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

describe('achatarAtivacao', () => {
  const funil = { status: 'enviado', enviado_em: '2026-11-01T10:00:00Z', respondeu_em: null, obs: 'ligar sexta' }

  it('leva o funil embutido para os campos planos e tira o objeto', () => {
    const r = achatarAtivacao({ id: 1, nome: 'Maria', prestador_ativacao: funil })
    expect(r).toEqual({
      id: 1, nome: 'Maria',
      ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-01T10:00:00Z',
      ativacao_respondeu_em: null, ativacao_obs: 'ligar sexta',
    })
    expect('prestador_ativacao' in r).toBe(false)
  })

  it('aceita o funil como lista de um item', () => {
    expect(achatarAtivacao({ id: 1, prestador_ativacao: [funil] }).ativacao_status).toBe('enviado')
  })

  it.each([null, undefined, []])('perfil sem linha de ativação (%j) conta como não contatado', (embutida) => {
    const r = achatarAtivacao({ id: 2, prestador_ativacao: embutida as never })
    expect(r).toMatchObject({
      ativacao_status: 'nao_enviado', ativacao_enviado_em: null, ativacao_respondeu_em: null, ativacao_obs: null,
    })
  })
})
