// lib/buscaFiltros.test.ts
import { describe, it, expect } from 'vitest'
import {
  calcularFacetas, decidirCidade, filtrarExibidos, normalizarCidade, parsearBusca,
  type FiltrosAtivos, type ItemBusca,
} from '@/lib/buscaFiltros'
import { getIniciais, getTituloBusca } from '@/lib/prestadorUtils'

const sem: FiltrosAtivos = { estado: '', regiao: '', grupo: '', categoria: '', cidade: '' }

function item(extra: Partial<ItemBusca>): ItemBusca {
  return {
    estado_sigla: 'PR', regiao_id: 'r1', regiao_nome: 'Norte', cidade_id: 'cid-lon', cidade_nome: 'Londrina',
    grupo_id: 'g1', grupo_nome: 'Construção', categoria_id: 'c1', categoria: 'Pedreiro', ...extra,
  }
}

const base: ItemBusca[] = [
  item({}), item({}),
  item({ categoria_id: 'c2', categoria: 'Eletricista' }),
  item({ grupo_id: 'g2', grupo_nome: 'Beleza', categoria_id: 'c3', categoria: 'Manicure' }),
  item({ cidade_id: 'cid-mar', cidade_nome: 'Maringá', regiao_id: 'r1' }),
  item({ estado_sigla: 'SP', regiao_id: 'r2', regiao_nome: 'Capital', cidade_id: 'cid-sp', cidade_nome: 'São Paulo' }),
]

describe('parsearBusca / normalizarCidade', () => {
  it('separa a cidade escrita na busca', () => {
    expect(parsearBusca('massagista em Maringá')).toEqual({ termo: 'massagista', cidadeExtraida: 'Maringá' })
    expect(parsearBusca('pedreiro')).toEqual({ termo: 'pedreiro', cidadeExtraida: null })
  })
  it('compara cidades sem acento, caixa ou UF', () => {
    expect(normalizarCidade('Londrina - PR')).toBe('londrina')
    expect(normalizarCidade('MARINGÁ')).toBe('maringa')
  })
})

describe('decidirCidade', () => {
  const o = { cidadeDaBusca: null, filtroCidade: '', filtroEstado: '', filtroRegiao: '', ampliar: false, cidadeSalva: 'Londrina' }

  it('usa a cidade salva quando não há nada mais específico', () => {
    expect(decidirCidade(o)).toEqual({ nome: 'Londrina', origem: 'salva' })
  })
  it('a cidade escrita na busca vence a salva', () => {
    expect(decidirCidade({ ...o, cidadeDaBusca: 'Maringá' })).toEqual({ nome: 'Maringá', origem: 'texto' })
  })
  it('a cidade da URL/filtro vence tudo', () => {
    expect(decidirCidade({ ...o, filtroCidade: 'Curitiba', cidadeDaBusca: 'Maringá' })).toEqual({ nome: 'Curitiba', origem: 'filtro' })
  })
  it('"Ver outras cidades" desliga só a cidade salva', () => {
    expect(decidirCidade({ ...o, ampliar: true })).toEqual({ nome: null, origem: null })
    expect(decidirCidade({ ...o, ampliar: true, cidadeDaBusca: 'Maringá' }).nome).toBe('Maringá')
  })
  it('estado ou região escolhidos soltam a cidade salva', () => {
    expect(decidirCidade({ ...o, filtroEstado: 'SP' }).nome).toBeNull()
    expect(decidirCidade({ ...o, filtroRegiao: 'r1' }).nome).toBeNull()
  })
  it('sem cidade nenhuma, fica sem cidade', () => {
    expect(decidirCidade({ ...o, cidadeSalva: null })).toEqual({ nome: null, origem: null })
  })
})

describe('filtrarExibidos', () => {
  it('aplica todos os filtros juntos', () => {
    expect(filtrarExibidos(base, { ...sem, cidade: 'londrina' })).toHaveLength(4)
    expect(filtrarExibidos(base, { ...sem, cidade: 'londrina', grupo: 'g1' })).toHaveLength(3)
    expect(filtrarExibidos(base, { ...sem, estado: 'SP' })).toHaveLength(1)
  })
})

describe('calcularFacetas — a contagem é o que sobra ao escolher a opção', () => {
  it('Área respeita a cidade escolhida (não conta o catálogo todo)', () => {
    const { grupos } = calcularFacetas(base, { ...sem, cidade: 'londrina' })
    expect(grupos.find(g => g.id === 'g1')?.count).toBe(3)
    expect(grupos.find(g => g.id === 'g2')?.count).toBe(1)
  })

  it('Cidade respeita a Área escolhida', () => {
    const { cidades } = calcularFacetas(base, { ...sem, grupo: 'g2' })
    expect(cidades).toEqual([{ id: 'cid-lon', nome: 'Londrina', count: 1 }])
  })

  it('Estado ignora a cidade escolhida, para dar para trocar de estado', () => {
    const { estados } = calcularFacetas(base, { ...sem, cidade: 'londrina' })
    expect(estados.map(e => e.sigla).sort()).toEqual(['PR', 'SP'])
  })

  it('Categoria só mostra as da Área escolhida e respeita a cidade', () => {
    const { categorias } = calcularFacetas(base, { ...sem, grupo: 'g1', cidade: 'londrina' })
    expect(categorias.map(c => [c.id, c.count])).toEqual([['c1', 2], ['c2', 1]])
  })

  it('a soma das contagens de uma opção bate com o tamanho da lista filtrada', () => {
    const f = { ...sem, cidade: 'londrina' }
    const { grupos } = calcularFacetas(base, f)
    for (const g of grupos) {
      expect(filtrarExibidos(base, { ...f, grupo: g.id })).toHaveLength(g.count)
    }
  })
})

describe('getTituloBusca', () => {
  it('mostra a cidade quando existe', () => {
    expect(getTituloBusca('', 'Londrina')).toBe('Profissionais em Londrina')
    expect(getTituloBusca('pedreiro', 'Londrina')).toBe('Resultados para "pedreiro" em Londrina')
  })
  it('é genérico sem cidade', () => {
    expect(getTituloBusca('', null)).toBe('Profissionais cadastrados')
    expect(getTituloBusca('pedreiro', null)).toBe('Resultados para "pedreiro"')
  })
  it('não repete a cidade que já está escrita na busca', () => {
    expect(getTituloBusca('pedreiro em Maringá', 'Maringá', true)).toBe('Resultados para "pedreiro em Maringá"')
  })
})

describe('cidades com o mesmo nome', () => {
  const homonimas: ItemBusca[] = [
    item({ cidade_id: 'pr', cidade_nome: 'Santa Helena', estado_sigla: 'PR' }),
    item({ cidade_id: 'pr', cidade_nome: 'Santa Helena', estado_sigla: 'PR' }),
    item({ cidade_id: 'sc', cidade_nome: 'Santa Helena', estado_sigla: 'SC' }),
    item({ cidade_id: 'lon', cidade_nome: 'Londrina', estado_sigla: 'PR' }),
  ]

  it('filtrar pelo id não mistura as duas', () => {
    expect(filtrarExibidos(homonimas, { ...sem, cidadeId: 'pr' })).toHaveLength(2)
    expect(filtrarExibidos(homonimas, { ...sem, cidadeId: 'sc' })).toHaveLength(1)
  })

  it('só pelo nome (texto digitado, link antigo) ainda acha as duas', () => {
    expect(filtrarExibidos(homonimas, { ...sem, cidade: 'santa helena' })).toHaveLength(3)
  })

  it('as opções ganham a sigla do estado só quando o nome se repete', () => {
    const { cidades } = calcularFacetas(homonimas, sem)
    expect(cidades).toEqual([
      { id: 'pr', nome: 'Santa Helena - PR', count: 2 },
      { id: 'lon', nome: 'Londrina', count: 1 },
      { id: 'sc', nome: 'Santa Helena - SC', count: 1 },
    ])
  })
})

describe('getIniciais', () => {
  it('ignora palavras de ligação', () => {
    expect(getIniciais('Construções e Reformas')).toBe('CR')
    expect(getIniciais('Maria da Silva')).toBe('MS')
    expect(getIniciais('Waneza Marques Vieira')).toBe('WM')
  })
  it('uma palavra só, vazio e só ligação', () => {
    expect(getIniciais('Pedreiro')).toBe('P')
    expect(getIniciais('')).toBe('?')
    expect(getIniciais('de')).toBe('D')
  })
})
