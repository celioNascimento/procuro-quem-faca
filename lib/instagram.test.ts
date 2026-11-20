import { describe, expect, it } from 'vitest'
import { arrobaDoInstagram, enderecoDoInstagram, instagramParaGravar, normalizarInstagram, usuarioDeInstagramValido } from './instagram'

const ok = (usuario: string | null) => ({ ok: true, usuario })

describe('normalizarInstagram', () => {
  it('vazio é permitido (campo opcional)', () => {
    expect(normalizarInstagram('')).toEqual(ok(null))
    expect(normalizarInstagram('   ')).toEqual(ok(null))
    expect(normalizarInstagram(null)).toEqual(ok(null))
    expect(normalizarInstagram(undefined)).toEqual(ok(null))
  })
  it('aceita com ou sem @, em qualquer caixa, e guarda em minúsculas', () => {
    expect(normalizarInstagram('@PedroPedreiro')).toEqual(ok('pedropedreiro'))
    expect(normalizarInstagram('pedro.pedreiro_01')).toEqual(ok('pedro.pedreiro_01'))
    expect(normalizarInstagram('  @pedro  ')).toEqual(ok('pedro'))
  })
  it('extrai o usuário de um link do perfil, ignorando barra final e parâmetros', () => {
    expect(normalizarInstagram('https://www.instagram.com/pedropedreiro/')).toEqual(ok('pedropedreiro'))
    expect(normalizarInstagram('instagram.com/pedropedreiro')).toEqual(ok('pedropedreiro'))
    expect(normalizarInstagram('https://instagram.com/pedropedreiro?igsh=abc123&utm_source=qr')).toEqual(ok('pedropedreiro'))
    expect(normalizarInstagram('http://m.instagram.com/Pedro_P#x')).toEqual(ok('pedro_p'))
    expect(normalizarInstagram('https://instagr.am/pedro')).toEqual(ok('pedro'))
  })
  it('recusa link de post, reel e páginas que não são perfil', () => {
    for (const u of ['https://instagram.com/p/Cabc123/', 'instagram.com/reel/xyz', 'https://www.instagram.com/explore/', 'https://www.instagram.com/']) {
      expect(normalizarInstagram(u).ok).toBe(false)
    }
  })
  it('recusa outro site, mesmo parecido com o Instagram', () => {
    for (const u of ['https://facebook.com/pedro', 'https://instagram.com.golpe.xyz/pedro', 'https://evil.com/instagram.com/pedro', 'javascript:alert(1)', 'http://localhost/pedro']) {
      expect(normalizarInstagram(u).ok).toBe(false)
    }
  })
  it('recusa usuário fora das regras do Instagram', () => {
    for (const u of ['@', 'a b', 'pedro!', 'pedro..silva', '.pedro', 'pedro.', 'a'.repeat(31), 'pedrô', "x';drop table prestadores;--"]) {
      expect(normalizarInstagram(u).ok).toBe(false)
    }
    expect(normalizarInstagram('a'.repeat(30))).toEqual(ok('a'.repeat(30)))
  })
  it('a mensagem de erro explica o que digitar', () => {
    const r = normalizarInstagram('???')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toMatch(/@seunome/)
  })
})

describe('endereço e exibição', () => {
  it('o link é sempre o do Instagram', () => {
    expect(enderecoDoInstagram('pedro')).toBe('https://www.instagram.com/pedro/')
    expect(arrobaDoInstagram('pedro')).toBe('@pedro')
  })
  it('usuarioDeInstagramValido protege o que vem do banco', () => {
    expect(usuarioDeInstagramValido('pedro.p')).toBe(true)
    expect(usuarioDeInstagramValido('javascript:alert(1)')).toBe(false)
    expect(usuarioDeInstagramValido('Pedro')).toBe(false) // o banco guarda minúsculas
  })
})

describe('instagramParaGravar (o que vai para o banco)', () => {
  it('campo vazio vira null, nunca texto vazio (a constraint do banco recusa \'\')', () => {
    expect(instagramParaGravar('')).toBeNull()
    expect(instagramParaGravar('   ')).toBeNull()
    expect(instagramParaGravar(null)).toBeNull()
    expect(instagramParaGravar(undefined)).toBeNull()
  })

  it('usuário válido vai sem @ e em minúsculas', () => {
    expect(instagramParaGravar('@ProcuroQuemFaca')).toBe('procuroquemfaca')
    expect(instagramParaGravar('https://www.instagram.com/seu.nome/')).toBe('seu.nome')
  })

  it('valor inválido não vai para o banco (null em vez de quebrar o salvamento)', () => {
    expect(instagramParaGravar('dois espaços aqui')).toBeNull()
    expect(instagramParaGravar('instagram.com/p/abc')).toBeNull()
  })
})
