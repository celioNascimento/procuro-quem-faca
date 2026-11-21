import { describe, expect, it } from 'vitest'
import { emailValido, mensagemDoCodigoEquipe, normalizarEquipe, podeRemover, rotuloDoPapel, semDuasEtapas } from './equipe'

const bruto = {
  eu_dono: true, meu_id: 'u1',
  membros: [
    { user_id: 'u1', email: 'celio.gih@gmail.com', role: 'owner', desde: '2026-10-01T00:00:00Z', ultimo_acesso: '2026-11-21T10:00:00Z', duas_etapas: true },
    { user_id: 'u2', email: 'procuroquemfaca@gmail.com', role: 'editor', desde: null, ultimo_acesso: null, duas_etapas: false },
    { sem_id: true },
  ],
}

describe('equipe de admins', () => {
  it('normaliza o retorno do banco, ignorando linhas sem id', () => {
    const e = normalizarEquipe(bruto)
    expect(e.euDono).toBe(true)
    expect(e.meuId).toBe('u1')
    expect(e.membros.map((m) => [m.email, m.role, m.duasEtapas, m.ultimoAcesso])).toEqual([
      ['celio.gih@gmail.com', 'owner', true, '2026-11-21T10:00:00Z'],
      ['procuroquemfaca@gmail.com', 'editor', false, null],
    ])
  })

  it('resposta vazia ou estranha vira equipe vazia, sem permissões', () => {
    for (const x of [null, undefined, 'x', {}, { membros: 'x' }]) {
      expect(normalizarEquipe(x)).toEqual({ euDono: false, meuId: null, membros: [] })
    }
  })

  it('só o dono remove, e nunca a si mesmo', () => {
    const e = normalizarEquipe(bruto)
    expect(podeRemover(e, e.membros[0])).toBe(false)
    expect(podeRemover(e, e.membros[1])).toBe(true)
    expect(podeRemover({ ...e, euDono: false }, e.membros[1])).toBe(false)
  })

  it('aponta quem ainda não ligou as duas etapas', () => {
    expect(semDuasEtapas(normalizarEquipe(bruto)).map((m) => m.email)).toEqual(['procuroquemfaca@gmail.com'])
  })

  it('valida e-mail e traduz os códigos do banco', () => {
    expect(emailValido(' a@b.co ')).toBe(true)
    expect(['', 'abc', 'a@b', 'a @b.co'].some(emailValido)).toBe(false)
    expect(mensagemDoCodigoEquipe('sem_conta')).toContain('ainda não tem conta')
    expect(mensagemDoCodigoEquipe('ultimo_dono')).toContain('único dono')
    expect(mensagemDoCodigoEquipe('qualquer')).toBe('Não foi possível concluir. Tente de novo.')
    expect(rotuloDoPapel('owner')).toBe('Dono')
    expect(rotuloDoPapel('x')).toBe('x')
  })
})
