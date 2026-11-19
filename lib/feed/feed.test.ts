import { describe, expect, it } from 'vitest'
import { aplicarCurtida, aplicarSeguir, mensagemDeResultado, normalizarFeed, textoCurtidas } from './feed'

const bruto = [{
  projeto_id: 'a', titulo: ' Reforma ', descricao: 'Varanda', concluido_em: '2026-11-10T10:00:00Z',
  prestador: { id: 2, nome: 'Pedro', slug: 'pedro', categoria: 'Pedreiro', cidade: 'Londrina' },
  fotos: ['https://x/1.jpg', '', 5], total_curtidas: 3, curtido_por_mim: true, seguindo: false,
}]

describe('normalizarFeed', () => {
  it('converte o que vem do banco', () => {
    const [i] = normalizarFeed(bruto)
    expect(i).toMatchObject({ projetoId: 'a', titulo: 'Reforma', totalCurtidas: 3, curtidoPorMim: true, seguindo: false })
    expect(i.fotos).toEqual(['https://x/1.jpg'])
    expect(i.prestador.slug).toBe('pedro')
  })
  it('descarta item sem foto, sem prestador ou lixo', () => {
    expect(normalizarFeed([{ ...bruto[0], fotos: [] }])).toEqual([])
    expect(normalizarFeed([{ ...bruto[0], prestador: {} }])).toEqual([])
    expect(normalizarFeed(null)).toEqual([])
    expect(normalizarFeed('x')).toEqual([])
  })
  it('título vazio vira texto padrão', () => {
    expect(normalizarFeed([{ ...bruto[0], titulo: '  ' }])[0].titulo).toBe('Trabalho concluído')
  })
})

describe('textos e atualizações', () => {
  it('textoCurtidas', () => {
    expect(textoCurtidas(0)).toBe('Seja o primeiro a curtir')
    expect(textoCurtidas(1)).toBe('1 curtida')
    expect(textoCurtidas(7)).toBe('7 curtidas')
  })
  it('mensagemDeResultado: ok é silencioso, erros viram frase', () => {
    expect(mensagemDeResultado('ok')).toBeNull()
    expect(mensagemDeResultado(undefined)).toBeNull()
    expect(mensagemDeResultado('nao_autenticado')).toMatch(/Entre na sua conta/)
    expect(mensagemDeResultado('proprio_perfil')).toMatch(/próprio perfil/)
    expect(mensagemDeResultado('limite_atingido')).toMatch(/500/)
    expect(mensagemDeResultado('xyz')).toMatch(/Tente de novo/)
  })
  it('aplicarCurtida e aplicarSeguir só mexem no que devem', () => {
    const itens = normalizarFeed([bruto[0], { ...bruto[0], projeto_id: 'b', prestador: { ...bruto[0].prestador, id: 9, slug: 'maria' } }])
    expect(aplicarCurtida(itens, 'b', true, 8).map(i => [i.projetoId, i.totalCurtidas])).toEqual([['a', 3], ['b', 8]])
    expect(aplicarSeguir(itens, 2, true).map(i => i.seguindo)).toEqual([true, false])
  })
})
