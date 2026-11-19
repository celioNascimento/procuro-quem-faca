import { describe, expect, it } from 'vitest'
import { aplicarCurtida, aplicarFeedOculto, aplicarRetiradaDoFeed, podeRetirarDoFeed, aplicarSeguir, estadoNoFeed, mensagemDeResultado, normalizarFeed, textoCompartilharTrabalho, textoCurtidas } from './feed'

const bruto = [{
  projeto_id: 'a', titulo: ' Reforma ', descricao: 'Varanda', concluido_em: '2026-11-10T10:00:00Z',
  prestador: { id: 2, nome: 'Pedro', slug: 'pedro', categoria: 'Pedreiro', cidade: 'Londrina' },
  fotos: ['https://x/1.jpg', '', 5], total_curtidas: 3, curtido_por_mim: true, seguindo: false, meu: false,
}]

describe('normalizarFeed: campo meu', () => {
  it('vem true só quando o banco manda true; ausente ou outro valor vira false', () => {
    expect(normalizarFeed([{ ...bruto[0], meu: true }])[0].meu).toBe(true)
    expect(normalizarFeed([{ ...bruto[0], meu: 'true' }])[0].meu).toBe(false)
    expect(normalizarFeed([{ ...bruto[0], meu: undefined }])[0].meu).toBe(false)
  })
})

describe('normalizarFeed', () => {
  it('converte o que vem do banco', () => {
    const [i] = normalizarFeed(bruto)
    expect(i).toMatchObject({ projetoId: 'a', titulo: 'Reforma', totalCurtidas: 3, curtidoPorMim: true, seguindo: false, meu: false })
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

describe('controle "Mostrar no feed" do prestador', () => {
  const base = { status: 'finalizado', feed_aceito_em: '2026-11-19T10:00:00Z', feed_revogado_em: null, feed_oculto: false }
  it('estadoNoFeed: elegível aparece como visível ou oculto', () => {
    expect(estadoNoFeed(base)).toBe('visivel')
    expect(estadoNoFeed({ ...base, feed_oculto: true })).toBe('oculto')
  })
  it('estadoNoFeed: sem controle quando não pode estar no feed', () => {
    expect(estadoNoFeed({ ...base, status: 'em_execucao' })).toBeNull()
    expect(estadoNoFeed({ ...base, status: 'pendente' })).toBeNull()
    expect(estadoNoFeed({ ...base, feed_aceito_em: null })).toBeNull()
    expect(estadoNoFeed({ status: 'finalizado' })).toBeNull()
    expect(estadoNoFeed({ ...base, feed_revogado_em: '2026-11-20T10:00:00Z' })).toBeNull()
  })
  it('aplicarFeedOculto só muda o trabalho certo', () => {
    const lista = [{ id: 'a', feed_oculto: false }, { id: 'b', feed_oculto: false }]
    expect(aplicarFeedOculto(lista, 'b', true)).toEqual([{ id: 'a', feed_oculto: false }, { id: 'b', feed_oculto: true }])
  })
  it('mensagemDeResultado: nao_e_dono vira frase', () => {
    expect(mensagemDeResultado('nao_e_dono')).toMatch(/Só quem registrou/)
  })
})

describe('"Retirar do feed" do cliente', () => {
  const ok = { status: 'finalizado', feed_aceito_em: '2026-11-19T10:00:00Z', feed_revogado_em: null }
  it('podeRetirarDoFeed: só concluído, aceito com o aviso e ainda não retirado', () => {
    expect(podeRetirarDoFeed(ok)).toBe(true)
    expect(podeRetirarDoFeed({ ...ok, status: 'em_execucao' })).toBe(false)
    expect(podeRetirarDoFeed({ ...ok, feed_aceito_em: null })).toBe(false)
    expect(podeRetirarDoFeed({ ...ok, feed_revogado_em: '2026-11-20T10:00:00Z' })).toBe(false)
  })
  it('aplicarRetiradaDoFeed marca só o trabalho certo', () => {
    const lista = [{ id: 'a', feed_revogado_em: null }, { id: 'b', feed_revogado_em: null }]
    expect(aplicarRetiradaDoFeed(lista, 'a', 'agora')).toEqual([{ id: 'a', feed_revogado_em: 'agora' }, { id: 'b', feed_revogado_em: null }])
  })
})

describe('textoCompartilharTrabalho', () => {
  it('cita o trabalho e o prestador', () => {
    expect(textoCompartilharTrabalho({ titulo: 'Reforma de varanda', prestador: { id: 2, nome: 'Pedro Pedreiro', slug: 'pedro', categoria: null, cidade: null } }))
      .toBe('Veja "Reforma de varanda", trabalho de Pedro Pedreiro no Procuro Quem Faça.')
  })
})
