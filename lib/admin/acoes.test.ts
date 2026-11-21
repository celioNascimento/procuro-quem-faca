import { describe, expect, it } from 'vitest'
import { filtrarAcoes, fraseDaAcao, grupoDaAcao, nomeDeQuem, pessoasDoRegistro, type AcaoAdmin } from './acoes'

const a = (extra: Partial<AcaoAdmin> = {}): AcaoAdmin => ({
  id: 1, quando: '2026-11-21T10:00:00Z', admin_id: 'u1', admin_email: 'celio.gih@gmail.com', acao: 'bloqueou_prestador',
  alvo_tipo: 'prestador', alvo_id: '7', alvo_nome: 'Ana Souza', motivo: null, detalhes: {}, ...extra,
})

describe('registro de ações do admin', () => {
  it('escreve cada ação como uma frase simples', () => {
    expect(fraseDaAcao(a())).toBe('celio.gih bloqueou Ana Souza')
    expect(fraseDaAcao(a({ acao: 'desbloqueou_prestador' }))).toBe('celio.gih desbloqueou Ana Souza')
    expect(fraseDaAcao(a({ acao: 'removeu_do_feed', alvo_nome: 'Pintura' }))).toBe('celio.gih removeu o trabalho "Pintura" do feed')
    expect(fraseDaAcao(a({ acao: 'devolveu_ao_feed', alvo_nome: 'Pintura' }))).toBe('celio.gih devolveu o trabalho "Pintura" ao feed')
    expect(fraseDaAcao(a({ acao: 'aprovou_verificacao', detalhes: { tipo: 'cnpj' } }))).toBe('celio.gih aprovou a verificação de CNPJ de Ana Souza')
    expect(fraseDaAcao(a({ acao: 'rejeitou_verificacao', detalhes: { tipo: 'seguro' } }))).toBe('celio.gih rejeitou a verificação de seguro de Ana Souza')
    expect(fraseDaAcao(a({ acao: 'mudou_status_convite', detalhes: { de: 'nao_enviado', para: 'enviado' } })))
      .toBe('celio.gih mudou o convite de Ana Souza: Não enviado → Enviado')
    expect(fraseDaAcao(a({ acao: 'adicionou_admin', alvo_nome: 'Gih' }))).toBe('celio.gih adicionou Gih à equipe')
    expect(fraseDaAcao(a({ acao: 'removeu_admin', alvo_nome: 'Gih' }))).toBe('celio.gih tirou Gih da equipe')
  })

  it('sem nome do alvo usa o número; sem e-mail, "Alguém da equipe"; ação desconhecida não quebra', () => {
    expect(fraseDaAcao(a({ alvo_nome: null }))).toContain('#7')
    expect(nomeDeQuem({ admin_email: null })).toBe('Alguém da equipe')
    expect(fraseDaAcao(a({ acao: 'coisa_nova' }))).toContain('coisa_nova')
    expect(grupoDaAcao('coisa_nova')).toBeNull()
  })

  it('filtra por tipo de ação e por pessoa, e lista as pessoas sem repetir', () => {
    const lista = [
      a({ id: 1 }),
      a({ id: 2, acao: 'removeu_do_feed', admin_email: 'procuroquemfaca@gmail.com' }),
      a({ id: 3, acao: 'aprovou_verificacao', admin_email: 'celio.gih@gmail.com' }),
    ]
    expect(filtrarAcoes(lista, { grupo: 'todos', quem: '' })).toHaveLength(3)
    expect(filtrarAcoes(lista, { grupo: 'feed', quem: '' }).map((x) => x.id)).toEqual([2])
    expect(filtrarAcoes(lista, { grupo: 'todos', quem: 'celio.gih@gmail.com' }).map((x) => x.id)).toEqual([1, 3])
    expect(filtrarAcoes(lista, { grupo: 'feed', quem: 'celio.gih@gmail.com' })).toEqual([])
    expect(pessoasDoRegistro(lista)).toEqual(['celio.gih@gmail.com', 'procuroquemfaca@gmail.com'])
  })
})
