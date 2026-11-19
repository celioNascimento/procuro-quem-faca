import { describe, expect, it } from 'vitest'
import { cidadesDoEstado, estadosDoFeed, estadoValido, filtrosAoTrocarEstado, idValido, lerFiltrosDaUrl, montarEnderecoDoFeed, normalizarCidadesDoFeed, rotuloDaCidade, temFiltroAtivo } from './filtros'

const A = '15123e3f-9f76-4d66-b2ee-f03c45de38fa'
const B = '22222222-2222-4222-8222-222222222222'

describe('filtros do feed na URL', () => {
  it('idValido aceita UUID e recusa o resto', () => {
    expect(idValido(A)).toBe(A)
    expect(idValido(` ${A} `)).toBe(A)
    expect(idValido('abc')).toBeNull()
    expect(idValido("1' or 1=1")).toBeNull()
    expect(idValido(null)).toBeNull()
    expect(idValido('')).toBeNull()
  })
  it('lerFiltrosDaUrl lê categoria e cidade; link adulterado vira "sem filtro"', () => {
    expect(lerFiltrosDaUrl(new URLSearchParams(`categoria=${A}&cidade=${B}`))).toEqual({ categoriaId: A, cidadeId: B, estado: null })
    expect(lerFiltrosDaUrl(new URLSearchParams('categoria=x&cidade='))).toEqual({ categoriaId: null, cidadeId: null, estado: null })
    expect(lerFiltrosDaUrl(new URLSearchParams(''))).toEqual({ categoriaId: null, cidadeId: null, estado: null })
  })
  it('montarEnderecoDoFeed: sem filtro volta ao endereço limpo', () => {
    expect(montarEnderecoDoFeed('/feed', { categoriaId: null, cidadeId: null, estado: null })).toBe('/feed')
    expect(montarEnderecoDoFeed('/feed', { categoriaId: A, cidadeId: null, estado: null })).toBe(`/feed?categoria=${A}`)
    expect(montarEnderecoDoFeed('/feed', { categoriaId: A, cidadeId: B, estado: null })).toBe(`/feed?categoria=${A}&cidade=${B}`)
    expect(montarEnderecoDoFeed('/feed', { categoriaId: A, cidadeId: B, estado: 'PR' })).toBe(`/feed?categoria=${A}&estado=PR&cidade=${B}`)
  })
  it('temFiltroAtivo', () => {
    expect(temFiltroAtivo({ categoriaId: null, cidadeId: null, estado: null })).toBe(false)
    expect(temFiltroAtivo({ categoriaId: null, cidadeId: B, estado: null })).toBe(true)
    expect(temFiltroAtivo({ categoriaId: null, cidadeId: null, estado: 'PR' })).toBe(true)
  })
})

describe('cidades do feed', () => {
  it('normaliza o que vem do banco e descarta item inválido', () => {
    const r = normalizarCidadesDoFeed([
      { id: A, nome: ' Londrina ', estado_sigla: 'PR' },
      { id: B, nome: 'Maringá', estado_sigla: '' },
      { id: 'xx', nome: 'Inválida', estado_sigla: 'PR' },
      { id: A, nome: '', estado_sigla: 'PR' },
      null,
    ])
    expect(r).toEqual([{ id: A, nome: 'Londrina', estadoSigla: 'PR' }, { id: B, nome: 'Maringá', estadoSigla: null }])
    expect(normalizarCidadesDoFeed('lixo')).toEqual([])
  })
  it('rotuloDaCidade', () => {
    expect(rotuloDaCidade({ id: A, nome: 'Londrina', estadoSigla: 'PR' })).toBe('Londrina - PR')
    expect(rotuloDaCidade({ id: A, nome: 'Londrina', estadoSigla: null })).toBe('Londrina')
  })
})

describe('estado do feed', () => {
  const londrina = { id: A, nome: 'Londrina', estadoSigla: 'PR' }
  const sp = { id: B, nome: 'Campinas', estadoSigla: 'SP' }
  const semUf = { id: '33333333-3333-4333-8333-333333333333', nome: 'Sem UF', estadoSigla: null }
  const cidades = [sp, londrina, semUf]

  it('estadoValido aceita duas letras (maiúsculas ou não) e recusa o resto', () => {
    expect(estadoValido('pr')).toBe('PR')
    expect(estadoValido(' SP ')).toBe('SP')
    expect(estadoValido('PRR')).toBeNull()
    expect(estadoValido("P'")).toBeNull()
    expect(estadoValido('12')).toBeNull()
    expect(estadoValido(null)).toBeNull()
  })
  it('lê o estado da URL', () => {
    expect(lerFiltrosDaUrl(new URLSearchParams('estado=pr')).estado).toBe('PR')
    expect(lerFiltrosDaUrl(new URLSearchParams('estado=xx1')).estado).toBeNull()
  })
  it('estadosDoFeed lista as UFs sem repetir, em ordem, ignorando cidade sem UF', () => {
    expect(estadosDoFeed([...cidades, { ...londrina, id: 'x' }])).toEqual(['PR', 'SP'])
    expect(estadosDoFeed([])).toEqual([])
  })
  it('cidadesDoEstado: sem estado devolve todas; com estado, só as dele', () => {
    expect(cidadesDoEstado(cidades, null)).toEqual(cidades)
    expect(cidadesDoEstado(cidades, 'PR')).toEqual([londrina])
  })
  it('trocar o estado limpa a cidade que não é dele e mantém a que é', () => {
    const base = { categoriaId: null, cidadeId: A, estado: null }
    expect(filtrosAoTrocarEstado(base, 'SP', cidades)).toEqual({ categoriaId: null, cidadeId: null, estado: 'SP' })
    expect(filtrosAoTrocarEstado(base, 'PR', cidades)).toEqual({ categoriaId: null, cidadeId: A, estado: 'PR' })
    expect(filtrosAoTrocarEstado(base, null, cidades)).toEqual({ categoriaId: null, cidadeId: A, estado: null })
  })
})
