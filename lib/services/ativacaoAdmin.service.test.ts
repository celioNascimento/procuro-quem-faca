import { beforeEach, describe, expect, it, vi } from 'vitest'

const upsert = vi.fn()
const rangeMock = vi.fn()
const ordenacoes: string[] = []
let selecionado = ''

vi.mock('@/lib/supabase', () => {
  const consulta: Record<string, unknown> = {}
  consulta.select = (colunas: string) => { selecionado = colunas; return consulta }
  consulta.order = (coluna: string) => { ordenacoes.push(coluna); return consulta }
  consulta.range = (de: number, ate: number) => rangeMock(de, ate)
  return { supabase: { from: (tabela: string) => (tabela === 'prestador_ativacao' ? { upsert } : consulta) } }
})

import { listarPerfisParaAtivacao, salvarObsAtivacao, salvarStatusAtivacao } from '@/lib/services/ativacaoAdmin.service'

beforeEach(() => { vi.clearAllMocks(); ordenacoes.length = 0; selecionado = '' })

describe('listarPerfisParaAtivacao', () => {
  it('traz o funil embutido, ordena com desempate e devolve no formato plano', async () => {
    rangeMock.mockResolvedValue({
      data: [
        { id: 2, nome: 'Ana', whatsapp: '43911112222', slug: 'ana', user_id: null,
          prestador_ativacao: { status: 'enviado', enviado_em: '2026-11-01T10:00:00Z', respondeu_em: null, obs: null } },
        { id: 1, nome: 'Zé', whatsapp: null, slug: null, user_id: null, prestador_ativacao: null },
      ],
      error: null,
    })

    const lista = await listarPerfisParaAtivacao()

    expect(selecionado).toContain('prestador_ativacao(status, enviado_em, respondeu_em, obs)')
    expect(ordenacoes).toEqual(['nome', 'id'])
    expect(lista[0]).toMatchObject({ id: 2, ativacao_status: 'enviado' })
    expect(lista[1]).toMatchObject({ id: 1, ativacao_status: 'nao_enviado' })
  })

  it('propaga o erro do banco', async () => {
    rangeMock.mockResolvedValue({ data: null, error: new Error('falhou') })
    await expect(listarPerfisParaAtivacao()).rejects.toThrow('falhou')
  })
})

describe('salvarStatusAtivacao', () => {
  beforeEach(() => upsert.mockResolvedValue({ error: null }))

  it('"enviado" grava a data de envio', async () => {
    const alterados = await salvarStatusAtivacao(7, 'enviado')
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ prestador_id: 7, status: 'enviado', enviado_em: expect.any(String) }))
    expect(alterados).toMatchObject({ ativacao_status: 'enviado', ativacao_enviado_em: expect.any(String) })
    expect(alterados).not.toHaveProperty('ativacao_respondeu_em')
  })

  it('"respondeu_positivo" grava a data da resposta', async () => {
    const alterados = await salvarStatusAtivacao(7, 'respondeu_positivo')
    expect(upsert.mock.calls[0][0]).toMatchObject({ respondeu_em: expect.any(String) })
    expect(alterados).toMatchObject({ ativacao_status: 'respondeu_positivo', ativacao_respondeu_em: expect.any(String) })
  })

  it('outros status não mexem nas datas', async () => {
    await salvarStatusAtivacao(7, 'perfil_completo')
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('enviado_em')
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('respondeu_em')
  })

  it('propaga o erro do banco', async () => {
    upsert.mockResolvedValue({ error: new Error('sem permissão') })
    await expect(salvarStatusAtivacao(7, 'enviado')).rejects.toThrow('sem permissão')
  })
})

describe('salvarObsAtivacao', () => {
  it('grava a observação sem mexer no status, e texto vazio vira nulo', async () => {
    upsert.mockResolvedValue({ error: null })
    await salvarObsAtivacao(7, '  ligar sexta  ')
    expect(upsert.mock.calls[0][0]).toEqual({ prestador_id: 7, obs: 'ligar sexta', atualizado_em: expect.any(String) })
    expect(upsert.mock.calls[0][0]).not.toHaveProperty('status')

    await salvarObsAtivacao(7, '   ')
    expect(upsert.mock.calls[1][0].obs).toBeNull()
  })
})
