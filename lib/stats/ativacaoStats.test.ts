import { describe, it, expect } from 'vitest'
import { contarPorStatus } from './ativacaoStats'
import type { PrestadorAtivacao } from '@/lib/services/adminAtivacao.service'

function prestador(overrides: Partial<PrestadorAtivacao>): PrestadorAtivacao {
  return {
    id: 1,
    nome: 'Prestador Teste',
    whatsapp: '43999990000',
    slug: 'prestador-teste',
    ativacao_status: 'nao_enviado',
    ativacao_enviado_em: null,
    ativacao_obs: null,
    ...overrides,
  }
}

describe('contarPorStatus', () => {
  it('conta quantos prestadores há em cada status', () => {
    const lista = [
      prestador({ id: 1, ativacao_status: 'nao_enviado' }),
      prestador({ id: 2, ativacao_status: 'enviado' }),
      prestador({ id: 3, ativacao_status: 'enviado' }),
      prestador({ id: 4, ativacao_status: 'respondeu_positivo' }),
    ]

    expect(contarPorStatus(lista)).toEqual({
      nao_enviado: 1,
      enviado: 2,
      respondeu_positivo: 1,
    })
  })

  it('retorna objeto vazio para lista vazia', () => {
    expect(contarPorStatus([])).toEqual({})
  })

  it('não inclui no resultado status sem nenhum prestador', () => {
    const lista = [prestador({ id: 1, ativacao_status: 'avaliacao_recebida' })]
    const resultado = contarPorStatus(lista)

    expect(resultado).toEqual({ avaliacao_recebida: 1 })
    expect(resultado.sem_whatsapp).toBeUndefined()
  })
})
