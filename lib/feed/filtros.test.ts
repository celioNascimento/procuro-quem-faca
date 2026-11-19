import { describe, expect, it } from 'vitest'
import { idValido, lerFiltrosDaUrl, montarEnderecoDoFeed, normalizarCidadesDoFeed, rotuloDaCidade, temFiltroAtivo } from './filtros'

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
    expect(lerFiltrosDaUrl(new URLSearchParams(`categoria=${A}&cidade=${B}`))).toEqual({ categoriaId: A, cidadeId: B })
    expect(lerFiltrosDaUrl(new URLSearchParams('categoria=x&cidade='))).toEqual({ categoriaId: null, cidadeId: null })
    expect(lerFiltrosDaUrl(new URLSearchParams(''))).toEqual({ categoriaId: null, cidadeId: null })
  })
  it('montarEnderecoDoFeed: sem filtro volta ao endereço limpo', () => {
    expect(montarEnderecoDoFeed('/feed', { categoriaId: null, cidadeId: null })).toBe('/feed')
    expect(montarEnderecoDoFeed('/feed', { categoriaId: A, cidadeId: null })).toBe(`/feed?categoria=${A}`)
    expect(montarEnderecoDoFeed('/feed', { categoriaId: A, cidadeId: B })).toBe(`/feed?categoria=${A}&cidade=${B}`)
  })
  it('temFiltroAtivo', () => {
    expect(temFiltroAtivo({ categoriaId: null, cidadeId: null })).toBe(false)
    expect(temFiltroAtivo({ categoriaId: null, cidadeId: B })).toBe(true)
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
