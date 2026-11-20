import { describe, expect, it } from 'vitest'
import { emailParece, MSG_CREDENCIAIS_INVALIDAS } from '@/lib/auth/adminLogin'

describe('emailParece', () => {
  it('aceita e-mails comuns, ignorando espaços nas pontas', () => {
    expect(emailParece('admin@pqf.com.br')).toBe(true)
    expect(emailParece('  admin@pqf.com.br  ')).toBe(true)
  })

  it('recusa texto sem arroba, sem domínio ou com espaço no meio', () => {
    expect(emailParece('')).toBe(false)
    expect(emailParece('admin')).toBe(false)
    expect(emailParece('admin@')).toBe(false)
    expect(emailParece('admin@pqf')).toBe(false)
    expect(emailParece('ad min@pqf.com')).toBe(false)
  })
})

describe('mensagem de credencial', () => {
  it('não diz qual dos dois campos está errado', () => {
    expect(MSG_CREDENCIAIS_INVALIDAS.toLowerCase()).toContain('e-mail ou senha')
  })
})
