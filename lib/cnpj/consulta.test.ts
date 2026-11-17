// lib/cnpj/consulta.test.ts
import { describe, expect, it, vi } from 'vitest'
import { consultarCnpj, type Buscador } from './consulta'

const CNPJ = '11222333000181'

const respostaBrasilApi = {
  cnpj: CNPJ,
  razao_social: 'JOAO DA SILVA 12345678901',
  nome_fantasia: 'JS REPAROS',
  descricao_situacao_cadastral: 'ATIVA',
  porte: 'MICRO EMPRESA',
  natureza_juridica: '213-5 - Empresário (Individual)',
  opcao_pelo_mei: true,
  cnae_fiscal: 4330404,
  cnae_fiscal_descricao: 'Serviços de pintura',
  data_inicio_atividade: '2015-03-10',
  qsa: [{ nome_socio: 'JOAO DA SILVA' }],
}

function buscadorFalso(respostas: Record<string, { status: number; body?: unknown } | 'erro'>, chamadas: string[] = []): Buscador {
  return async (url) => {
    chamadas.push(url)
    const chave = Object.keys(respostas).find((k) => url.includes(k))
    const r = chave ? respostas[chave] : { status: 404 }
    if (r === 'erro') throw new Error('rede')
    return { status: r.status, json: async () => r.body }
  }
}

describe('consultarCnpj', () => {
  it('usa a BrasilAPI e normaliza os dados, tirando o CPF do nome do MEI', async () => {
    const r = await consultarCnpj(CNPJ, { buscar: buscadorFalso({ brasilapi: { status: 200, body: respostaBrasilApi } }), cache: new Map() })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.dados.fonte).toBe('brasilapi')
    expect(r.dados.razaoSocial).toBe('JOAO DA SILVA')
    expect(r.dados.situacao).toBe('ATIVA')
    expect(r.dados.cnaeCodigo).toBe('4330404')
    expect(r.dados.dataAbertura).toBe('2015-03-10')
    expect(r.dados.mei).toBe(true)
    expect(r.dados.socios).toEqual(['JOAO DA SILVA'])
  })

  it('cai para o espelho quando a primeira fonte falha', async () => {
    const r = await consultarCnpj(CNPJ, {
      buscar: buscadorFalso({ brasilapi: 'erro', minhareceita: { status: 200, body: respostaBrasilApi } }),
      cache: new Map(),
    })
    expect(r.ok && r.dados.fonte).toBe('minhareceita')
  })

  it('usa a ReceitaWS como última reserva, com data dd/mm/aaaa', async () => {
    const receitaws = {
      status: 'OK', nome: 'MARIA SOUZA', fantasia: '', situacao: 'Ativa',
      abertura: '10/03/2015', atividade_principal: [{ code: '43.30-4-04', text: 'Pintura' }],
      qsa: [{ nome: 'MARIA SOUZA' }], simei: { optante: true },
    }
    const r = await consultarCnpj(CNPJ, {
      buscar: buscadorFalso({ receitaws: { status: 200, body: receitaws } }),
      cache: new Map(),
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.dados.fonte).toBe('receitaws')
    expect(r.dados.situacao).toBe('ATIVA')
    expect(r.dados.dataAbertura).toBe('2015-03-10')
    expect(r.dados.cnaeCodigo).toBe('4330404')
  })

  it('reporta nao_encontrado quando todas as fontes dizem 404', async () => {
    const r = await consultarCnpj(CNPJ, { buscar: buscadorFalso({}), cache: new Map() })
    expect(r).toEqual({ ok: false, motivo: 'nao_encontrado' })
  })

  it('trata 400 de uma fonte como "não encontrado" nela, e segue para a próxima', async () => {
    const r = await consultarCnpj(CNPJ, {
      buscar: buscadorFalso({ brasilapi: { status: 400 }, minhareceita: { status: 404 }, receitaws: { status: 404 } }),
      cache: new Map(),
    })
    expect(r).toEqual({ ok: false, motivo: 'nao_encontrado' })
  })

  it('reporta indisponivel quando alguma fonte falha sem 404', async () => {
    const r = await consultarCnpj(CNPJ, { buscar: buscadorFalso({ brasilapi: 'erro' }), cache: new Map() })
    expect(r).toEqual({ ok: false, motivo: 'indisponivel' })
  })

  it('envia um User-Agent próprio nas chamadas às fontes (não o padrão "node")', async () => {
    const fetchEspiao = vi.fn(async () => new Response(JSON.stringify(respostaBrasilApi), { status: 200 }))
    vi.stubGlobal('fetch', fetchEspiao)
    try {
      await consultarCnpj(CNPJ, { cache: new Map() })
      const [, init] = fetchEspiao.mock.calls[0] as unknown as [string, { headers: Record<string, string> }]
      expect(init.headers['user-agent']).toMatch(/ProcuroQuemFaca/)
      expect(init.headers['user-agent']).not.toBe('node')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('guarda em cache e não chama as fontes de novo dentro do prazo', async () => {
    const cache = new Map()
    const chamadas: string[] = []
    const buscar = buscadorFalso({ brasilapi: { status: 200, body: respostaBrasilApi } }, chamadas)
    let agora = 1000
    await consultarCnpj(CNPJ, { buscar, cache, agora: () => agora })
    await consultarCnpj(CNPJ, { buscar, cache, agora: () => agora })
    expect(chamadas).toHaveLength(1)
    agora += 25 * 60 * 60 * 1000
    await consultarCnpj(CNPJ, { buscar, cache, agora: () => agora })
    expect(chamadas).toHaveLength(2)
  })

  it('não guarda falhas em cache', async () => {
    const cache = new Map()
    await consultarCnpj(CNPJ, { buscar: buscadorFalso({ brasilapi: 'erro' }), cache })
    expect(cache.size).toBe(0)
  })

  it('um cache assíncrono (banco) é lido e gravado; falha de leitura não derruba a consulta', async () => {
    const guardado: Record<string, { dados: unknown; expiraEm: number }> = {}
    const cacheBanco = {
      async get(c: string) { return guardado[c] as never },
      async set(c: string, e: { dados: unknown; expiraEm: number }) { guardado[c] = e },
    }
    const chamadas: string[] = []
    const buscar = buscadorFalso({ brasilapi: { status: 200, body: respostaBrasilApi } }, chamadas)
    await consultarCnpj(CNPJ, { buscar, cache: cacheBanco })
    const segunda = await consultarCnpj(CNPJ, { buscar, cache: cacheBanco })
    expect(chamadas).toHaveLength(1)
    expect(segunda.ok).toBe(true)

    const cacheQuebrado = {
      async get() { throw new Error('banco fora') },
      async set() { throw new Error('banco fora') },
    }
    const r = await consultarCnpj(CNPJ, { buscar: buscadorFalso({ brasilapi: { status: 200, body: respostaBrasilApi } }), cache: cacheQuebrado })
    expect(r.ok).toBe(true)
  })
})
