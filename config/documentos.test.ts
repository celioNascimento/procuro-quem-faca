import { describe, expect, it } from 'vitest'
import { rotaExigeAceite } from '@/config/documentos'

describe('rotaExigeAceite', () => {
  it.each(['/', '/prestadores', '/painel', '/dashboard', '/meus-servicos', '/maria-eletricista'])(
    'exige o aceite em %s',
    (rota) => expect(rotaExigeAceite(rota)).toBe(true),
  )

  it.each([
    '/termos', '/privacidade', '/login', '/auth/callback', '/cadastro', '/recuperar-senha',
    '/confirmar-exclusao', '/reivindicar', '/admin', '/admin/prestadores', '/meus-dados', '/titular',
  ])('não bloqueia %s, para o usuário poder ler, entrar, sair ou excluir a conta', (rota) =>
    expect(rotaExigeAceite(rota)).toBe(false),
  )

  it('não confunde rotas que só começam com o mesmo texto', () => {
    expect(rotaExigeAceite('/termos-de-servico-do-joao')).toBe(true)
    expect(rotaExigeAceite('/administrador-de-condominios')).toBe(true)
  })

  it('não exige em caminho vazio', () => {
    expect(rotaExigeAceite(null)).toBe(false)
    expect(rotaExigeAceite(undefined)).toBe(false)
  })
})
