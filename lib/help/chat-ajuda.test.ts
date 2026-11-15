// lib/help/chat-ajuda.test.ts
import { describe, it, expect } from 'vitest'
import { buscarRespostas, linkWhatsappSuporte, normalizarTexto, sugestoesIniciais } from '@/lib/help/chat-ajuda'

describe('normalizarTexto', () => {
  it('tira acento, pontuação e maiúsculas', () => {
    expect(normalizarTexto('  Avaliação, GARANTIA?! ')).toBe('avaliacao garantia')
  })
})

describe('buscarRespostas', () => {
  it('entende uma pergunta escrita com as palavras da pessoa', () => {
    const r = buscarRespostas('como eu avalio o prestador?', 'cliente')
    expect(r[0]?.id).toBe('avaliar-servico')
  })

  it('acha a garantia mesmo com palavras diferentes', () => {
    expect(buscarRespostas('tive um problema no trabalho, quero reclamar', 'cliente').map((a) => a.id)).toContain('garantia')
  })

  it('só devolve artigos do público certo', () => {
    const doCliente = buscarRespostas('responder garantia reclamação', 'cliente').map((a) => a.id)
    expect(doCliente).not.toContain('responder-garantia')
    expect(buscarRespostas('responder garantia', 'prestador').map((a) => a.id)).toContain('responder-garantia')
  })

  it('devolve vazio quando nada combina ou só há palavras sem valor', () => {
    expect(buscarRespostas('xyzabc qwerty', 'cliente')).toEqual([])
    expect(buscarRespostas('como para que', 'cliente')).toEqual([])
    expect(buscarRespostas('   ', 'cliente')).toEqual([])
  })

  it('respeita o limite', () => {
    expect(buscarRespostas('trabalho cliente serviço prestador', 'cliente', 2).length).toBeLessThanOrEqual(2)
  })
})

describe('sugestoesIniciais', () => {
  it('põe primeiro os artigos da tela de onde a pessoa veio', () => {
    const doContexto = sugestoesIniciais('cliente', 'acompanhamento')
    expect(doContexto.length).toBeGreaterThan(0)
    expect(doContexto.length).toBeLessThanOrEqual(4)
  })

  it('sem contexto devolve opções do público', () => {
    expect(sugestoesIniciais('prestador').length).toBeGreaterThan(0)
  })
})

describe('linkWhatsappSuporte', () => {
  it('aponta para o WhatsApp do PQF e leva a dúvida', () => {
    const link = linkWhatsappSuporte('prestador', 'não consigo editar meu perfil')
    expect(link.startsWith('https://wa.me/5543999739597?text=')).toBe(true)
    const texto = decodeURIComponent(link.split('text=')[1])
    expect(texto).toContain('Sou prestador')
    expect(texto).toContain('não consigo editar meu perfil')
  })

  it('funciona sem dúvida e corta textos muito longos', () => {
    expect(decodeURIComponent(linkWhatsappSuporte('cliente').split('text=')[1])).toContain('Sou cliente')
    const longo = 'a'.repeat(1000)
    expect(decodeURIComponent(linkWhatsappSuporte('cliente', longo).split('text=')[1]).length).toBeLessThan(400)
  })
})
