import { describe, expect, it } from 'vitest'
import { findHelpArticle, getHelpArticles, helpArticles, searchHelpArticles } from '@/lib/help/help-content'

describe('ajuda: Divulgação (prestador)', () => {
  it('a aba Divulgação tem artigos próprios para prestador', () => {
    const ids = getHelpArticles('prestador', 'divulgacao').map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'divulgacao-visao-geral',
        'divulgacao-cartao-digital',
        'divulgacao-adesivos-qrcode',
        'divulgacao-links-mensagens',
      ]),
    )
  })

  it('o painel do prestador mostra só a visão geral, para não lotar os atalhos', () => {
    const ids = getHelpArticles('prestador', 'dashboard-prestador').map((a) => a.id)
    expect(ids).toContain('divulgacao-visao-geral')
    expect(ids).not.toContain('divulgacao-cartao-digital')
  })

  it('não aparece para clientes nem visitantes', () => {
    expect(getHelpArticles('cliente', 'divulgacao')).toHaveLength(0)
    expect(searchHelpArticles('divulgação', 'publico').filter((a) => a.category === 'Divulgação')).toHaveLength(0)
  })

  it('a busca do prestador encontra os artigos', () => {
    expect(searchHelpArticles('QR Code', 'prestador').map((a) => a.id)).toContain('divulgacao-adesivos-qrcode')
  })

  it('related aponta só para artigos que existem', () => {
    const ids = new Set(helpArticles.map((a) => a.id))
    for (const artigo of helpArticles) {
      for (const rel of artigo.related ?? []) expect(ids.has(rel), `${artigo.id} -> ${rel}`).toBe(true)
    }
    expect(findHelpArticle('divulgacao-visao-geral')).toBeTruthy()
  })
})
