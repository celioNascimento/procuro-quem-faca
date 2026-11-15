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

describe('ajuda: cliente', () => {
  const doCliente = helpArticles.filter((a) => a.audiences.includes('cliente'))

  it('cada tela com bloco de ajuda tem artigos para o público dela', () => {
    // contexto + público usados pelos <ContextualHelp> do app
    const usos: Array<[Parameters<typeof getHelpArticles>[0], string]> = [
      ['cliente', 'dashboard-cliente'], // /painel/perfil
      ['cliente', 'meus-servicos'],     // /meus-servicos
      ['cliente', 'acompanhamento'],    // /acompanhamento/[token]
      ['cliente', 'perfil-publico'],    // /[slug]
      ['prestador', 'dashboard-prestador'],
      ['prestador', 'divulgacao'],
    ]
    for (const [publico, contexto] of usos) {
      expect(getHelpArticles(publico, contexto).length, `${publico}/${contexto}`).toBeGreaterThan(0)
    }
  })

  it('o bloco de ajuda da Área do cliente não vira uma parede de atalhos (máx. 5)', () => {
    const ids = getHelpArticles('cliente', 'dashboard-cliente').map((a) => a.id)
    expect(ids.length).toBeLessThanOrEqual(5)
    expect(ids).toEqual(expect.arrayContaining(['acompanhar-servico', 'aceitar-trabalho', 'status-do-trabalho', 'avaliar-servico', 'minha-conta-cliente']))
  })

  it('usa o vocabulário da Área do cliente: "trabalho", não "serviço/projeto" nem o nome antigo da área', () => {
    const textos = doCliente.flatMap((a) => [a.title, a.summary, a.category, ...(a.steps ?? [])])
    for (const t of textos) {
      expect(t, t).not.toMatch(/Meus serviços/i)
      expect(t, t).not.toMatch(/Portal do Cliente/i)
    }
    // os artigos do painel falam de "trabalho"
    for (const id of ['acompanhar-servico', 'aceitar-trabalho', 'status-do-trabalho', 'avaliar-servico', 'garantia']) {
      const a = findHelpArticle(id)!
      expect([a.title, a.summary, ...(a.steps ?? [])].join(' ')).toMatch(/trabalho/i)
    }
  })

  it('os status explicados batem com os nomes mostrados nos cartões', () => {
    const passos = (findHelpArticle('status-do-trabalho')?.steps ?? []).join(' ')
    for (const nome of ['Aguardando aceite', 'Em andamento', 'Avaliar agora', 'Concluído', 'Garantia', 'Reclamação']) {
      expect(passos).toContain(nome)
    }
  })

  it('nenhum texto promete "orçamento" (a plataforma ainda não trabalha com orçamento)', () => {
    for (const a of helpArticles) {
      expect([a.title, a.summary, ...(a.steps ?? [])].join(' ')).not.toMatch(/orçamento/i)
    }
  })

  it('ids antigos continuam válidos (links /ajuda?artigo=... já compartilhados)', () => {
    for (const id of ['acompanhar-servico', 'acompanhar-atualizacoes', 'avaliar-servico', 'garantia', 'conta-e-seguranca']) {
      expect(findHelpArticle(id), id).toBeTruthy()
    }
  })

  it('o prestador tem artigo sobre garantia na tela dele e ele fala só do que existe', () => {
    expect(getHelpArticles('prestador', 'dashboard-prestador').map((a) => a.id)).toContain('responder-garantia')
    const texto = (findHelpArticle('responder-garantia')?.steps ?? []).join(' ')
    expect(texto).toMatch(/5 dias úteis/)
    expect(texto).toMatch(/Oferecer reparo/)
    expect(texto).not.toMatch(/e-?mail/i) // avisos são só dentro do app
  })

  it('a busca do cliente acha os artigos novos', () => {
    expect(searchHelpArticles('recusar', 'cliente').map((a) => a.id)).toContain('aceitar-trabalho')
    expect(searchHelpArticles('foto', 'cliente').map((a) => a.id)).toContain('minha-conta-cliente')
  })
})
