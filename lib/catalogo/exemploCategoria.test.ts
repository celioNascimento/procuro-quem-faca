import { describe, expect, it } from 'vitest'
import { categoriasSemExemplo, MAX_EXEMPLO, validarExemploDeCategoria } from '@/lib/catalogo/exemploCategoria'

describe('validarExemploDeCategoria', () => {
  it('aceita uma frase normal e limpa os espaços', () => {
    expect(validarExemploDeCategoria('  Bolo de dois   andares para 40 pessoas.  ')).toEqual({ ok: true, valor: 'Bolo de dois andares para 40 pessoas.' })
  })

  it.each([undefined, null, '', '   '])('vazio (%j) é recusado com a regra do catálogo', (valor) => {
    const r = validarExemploDeCategoria(valor)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erro).toMatch(/toda categoria precisa/i)
  })

  it('frase curta demais é recusada', () => {
    const r = validarExemploDeCategoria('Pintura')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erro).toMatch(/curto demais/i)
  })

  it('frase longa demais é recusada', () => {
    const r = validarExemploDeCategoria('x'.repeat(MAX_EXEMPLO + 1))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erro).toMatch(/longo demais/i)
  })
})

describe('categoriasSemExemplo', () => {
  it('lista só as categorias sem exemplo (nulo, ausente ou em branco)', () => {
    const lista = [
      { nome: 'A', exemplo_descricao: 'Frase boa para a categoria A.' },
      { nome: 'B', exemplo_descricao: null },
      { nome: 'C' },
      { nome: 'D', exemplo_descricao: '   ' },
    ]
    expect(categoriasSemExemplo(lista).map((c) => c.nome)).toEqual(['B', 'C', 'D'])
  })
})
