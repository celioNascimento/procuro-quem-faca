import { describe, expect, it } from 'vitest'
import {
  achatarAtivacao, achatarLocal, achatarPerfil, correspondeABusca, nomeDoPerfil, NOME_PADRAO,
  opcoesDeLocal, passaFiltroLocal, SEM_VALOR, temFiltroLocal,
} from '@/lib/ativacao/lista'

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

describe('achatarLocal', () => {
  it('leva cidade, região e categoria para campos planos e tira os objetos embutidos', () => {
    const r = achatarLocal({
      id: 1,
      estado_sigla: 'PR',
      cidades: { nome: 'Londrina', estado_sigla: 'PR' },
      regioes: { nome: 'Grande Londrina' },
      categorias: { nome: 'Eletricista' },
    })
    expect(r).toMatchObject({ estado: 'PR', cidade: 'Londrina', regiao: 'Grande Londrina', categoria: 'Eletricista' })
    expect('cidades' in r).toBe(false)
    expect('regioes' in r).toBe(false)
    expect('categorias' in r).toBe(false)
  })

  it('o estado vem da cidade; sem cidade, usa o estado do próprio perfil', () => {
    expect(achatarLocal({ estado_sigla: 'RJ', cidades: { nome: 'Porto Alegre', estado_sigla: 'RS' } }).estado).toBe('RS')
    expect(achatarLocal({ estado_sigla: 'pr', cidades: null }).estado).toBe('PR')
  })

  it('tira espaços sobrando e aceita objetos como lista de um item', () => {
    const r = achatarLocal({ cidades: [{ nome: 'Rolândia ', estado_sigla: 'PR' }] })
    expect(r.cidade).toBe('Rolândia')
  })

  it.each([null, undefined, []])('perfil sem local (%j) fica com tudo nulo, sem quebrar', (vazio) => {
    const r = achatarLocal({ cidades: vazio as never, regioes: vazio as never, categorias: vazio as never })
    expect(r).toMatchObject({ estado: null, cidade: null, regiao: null, categoria: null })
  })

  it('achatarPerfil junta o funil e o local', () => {
    const r = achatarPerfil({
      id: 3,
      prestador_ativacao: { status: 'enviado', enviado_em: null, respondeu_em: null, obs: null },
      cidades: { nome: 'Maringá', estado_sigla: 'PR' },
    })
    expect(r).toMatchObject({ ativacao_status: 'enviado', cidade: 'Maringá', estado: 'PR' })
  })
})

describe('passaFiltroLocal', () => {
  const perfil = { estado: 'PR', cidade: 'Londrina', regiao: null, categoria: 'Eletricista' }

  it('filtro vazio não restringe nada', () => {
    expect(passaFiltroLocal(perfil, {})).toBe(true)
    expect(passaFiltroLocal(perfil, { estado: '', cidade: '' })).toBe(true)
  })

  it('combina os filtros: todos precisam bater', () => {
    expect(passaFiltroLocal(perfil, { estado: 'PR', cidade: 'Londrina' })).toBe(true)
    expect(passaFiltroLocal(perfil, { estado: 'PR', cidade: 'Maringá' })).toBe(false)
    expect(passaFiltroLocal(perfil, { estado: 'SP', cidade: 'Londrina' })).toBe(false)
  })

  it('SEM_VALOR pega só quem não tem o dado', () => {
    expect(passaFiltroLocal(perfil, { regiao: SEM_VALOR })).toBe(true)
    expect(passaFiltroLocal(perfil, { cidade: SEM_VALOR })).toBe(false)
  })

  it('um filtro de valor não pega perfil sem o dado', () => {
    expect(passaFiltroLocal(perfil, { regiao: 'Grande Londrina' })).toBe(false)
  })
})

describe('temFiltroLocal', () => {
  it('só é verdadeiro quando algum filtro está preenchido', () => {
    expect(temFiltroLocal({})).toBe(false)
    expect(temFiltroLocal({ estado: '', cidade: '' })).toBe(false)
    expect(temFiltroLocal({ categoria: 'Pedreiro' })).toBe(true)
  })
})

describe('opcoesDeLocal', () => {
  const perfis = [
    { cidade: 'Maringá' }, { cidade: 'Londrina' }, { cidade: 'Londrina' }, { cidade: null }, { cidade: 'Curitiba' },
  ]

  it('conta os perfis, em ordem alfabética, com "sem o dado" por último', () => {
    expect(opcoesDeLocal(perfis, 'cidade')).toEqual([
      { valor: 'Curitiba', quantidade: 1 },
      { valor: 'Londrina', quantidade: 2 },
      { valor: 'Maringá', quantidade: 1 },
      { valor: SEM_VALOR, quantidade: 1 },
    ])
  })

  it('não cria a opção "sem o dado" quando todos têm', () => {
    expect(opcoesDeLocal([{ estado: 'PR' }, { estado: 'SP' }], 'estado').map((o) => o.valor)).toEqual(['PR', 'SP'])
  })

  it('lista vazia não gera opções', () => {
    expect(opcoesDeLocal([], 'cidade')).toEqual([])
  })
})
