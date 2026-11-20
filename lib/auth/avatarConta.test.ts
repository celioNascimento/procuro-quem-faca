import { describe, expect, it } from 'vitest'
import { escolherAvatarConta, fotoDaContaGoogle } from '@/lib/auth/avatarConta'

describe('fotoDaContaGoogle', () => {
  it('usa picture quando existe', () => {
    expect(fotoDaContaGoogle({ picture: 'https://g/p.jpg', avatar_url: 'https://g/a.jpg' })).toBe('https://g/p.jpg')
  })

  it('cai para avatar_url quando não há picture', () => {
    expect(fotoDaContaGoogle({ avatar_url: 'https://g/a.jpg' })).toBe('https://g/a.jpg')
  })

  it('devolve vazio sem metadados, com valores vazios ou que não são texto', () => {
    expect(fotoDaContaGoogle(undefined)).toBe('')
    expect(fotoDaContaGoogle(null)).toBe('')
    expect(fotoDaContaGoogle({ picture: '  ', avatar_url: 42 })).toBe('')
  })
})

describe('escolherAvatarConta', () => {
  it('a foto enviada no perfil vence a do Google', () => {
    expect(escolherAvatarConta('https://pqf/foto.jpg', { picture: 'https://g/p.jpg' })).toBe('https://pqf/foto.jpg')
  })

  it('sem foto no perfil, usa a do Google', () => {
    expect(escolherAvatarConta(null, { picture: 'https://g/p.jpg' })).toBe('https://g/p.jpg')
    expect(escolherAvatarConta('', { avatar_url: 'https://g/a.jpg' })).toBe('https://g/a.jpg')
  })

  it('sem nenhuma foto, devolve vazio', () => {
    expect(escolherAvatarConta(undefined, {})).toBe('')
  })
})
