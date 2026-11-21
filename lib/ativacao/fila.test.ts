import { describe, expect, it } from 'vitest'
import {
  META_DIARIA, DIAS_PARA_LEMBRAR, diaLocal, enviadosHoje, podeReceberConvite, proximosConvites, restamHoje, semResposta,
  type PerfilDaFila,
} from './fila'

const AGORA = new Date('2026-11-20T15:00:00Z') // 12h em Brasília

function perfil(extra: Partial<PerfilDaFila> = {}): PerfilDaFila {
  return {
    id: 1, nome: 'Ana', slug: 'ana', whatsapp: '43999990000', user_id: null, cidade: 'Londrina',
    ativacao_status: 'nao_enviado', ativacao_enviado_em: null, ativacao_respondeu_em: null, ...extra,
  }
}

describe('fila de convites do dia', () => {
  it('a meta diária é 5 e o lembrete é com 3 dias', () => {
    expect(META_DIARIA).toBe(5)
    expect(DIAS_PARA_LEMBRAR).toBe(3)
  })

  it('"hoje" segue o calendário de Brasília: 23h de ontem em Brasília não é hoje, mesmo já sendo dia 21 em UTC', () => {
    expect(diaLocal('2026-11-21T01:30:00Z')).toBe('2026-11-20')
    const p = perfil({ ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-21T01:30:00Z' })
    expect(enviadosHoje([p], new Date('2026-11-20T23:00:00Z'))).toBe(1)
    expect(enviadosHoje([p], new Date('2026-11-21T12:00:00Z'))).toBe(0)
  })

  it('conta só os enviados hoje', () => {
    const lista = [
      perfil({ id: 1, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-20T13:00:00Z' }),
      perfil({ id: 2, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-19T13:00:00Z' }),
      perfil({ id: 3 }),
    ]
    expect(enviadosHoje(lista, AGORA)).toBe(1)
    expect(restamHoje(lista, AGORA)).toBe(4)
  })

  it('só convida quem não tem conta, nunca foi contatado e tem endereço e WhatsApp válidos', () => {
    expect(podeReceberConvite(perfil())).toBe(true)
    expect(podeReceberConvite(perfil({ user_id: 'u1' }))).toBe(false)
    expect(podeReceberConvite(perfil({ ativacao_status: 'enviado' }))).toBe(false)
    expect(podeReceberConvite(perfil({ slug: null }))).toBe(false)
    expect(podeReceberConvite(perfil({ whatsapp: '123' }))).toBe(false)
    expect(podeReceberConvite(perfil({ whatsapp: null }))).toBe(false)
  })

  it('a fila tem no máximo o que falta para a meta e põe Londrina primeiro', () => {
    const lista = [
      perfil({ id: 1, nome: 'Zé', cidade: 'Curitiba' }),
      perfil({ id: 2, nome: 'Bia', cidade: 'Londrina' }),
      perfil({ id: 3, nome: 'Ana', cidade: 'Londrina' }),
      perfil({ id: 4, nome: 'Caio', cidade: 'Maringá' }),
      perfil({ id: 5, nome: 'Dani', cidade: 'Londrina' }),
      perfil({ id: 6, nome: 'Edu', cidade: 'Londrina' }),
      perfil({ id: 7, nome: 'Fábio', cidade: 'Londrina' }),
    ]
    const fila = proximosConvites(lista, restamHoje(lista, AGORA))
    expect(fila).toHaveLength(5)
    expect(fila.map((p) => p.nome)).toEqual(['Ana', 'Bia', 'Dani', 'Edu', 'Fábio'])
  })

  it('já enviou 5 hoje: a fila fica vazia', () => {
    const enviados = [1, 2, 3, 4, 5].map((id) => perfil({ id, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-20T13:00:00Z' }))
    expect(proximosConvites([perfil({ id: 9 })], restamHoje(enviados, AGORA))).toEqual([])
    expect(restamHoje(enviados, AGORA)).toBe(0)
  })

  it('lembrete: contatado há 3 dias ou mais, sem resposta e sem conta; mais antigo primeiro', () => {
    const lista = [
      perfil({ id: 1, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-17T12:00:00Z' }), // 3 dias
      perfil({ id: 2, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-12T12:00:00Z' }), // 8 dias
      perfil({ id: 3, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-19T12:00:00Z' }), // 1 dia
      perfil({ id: 4, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-10T12:00:00Z', ativacao_respondeu_em: '2026-11-11T12:00:00Z' }),
      perfil({ id: 5, ativacao_status: 'enviado', ativacao_enviado_em: '2026-11-10T12:00:00Z', user_id: 'u1' }),
      perfil({ id: 6, ativacao_status: 'respondeu_positivo', ativacao_enviado_em: '2026-11-10T12:00:00Z' }),
    ]
    const itens = semResposta(lista, AGORA)
    expect(itens.map((i) => [i.perfil.id, i.dias])).toEqual([[2, 8], [1, 3]])
  })
})
