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

describe('ajuda: selos de confiança e CNPJ', () => {
  it('o prestador tem o artigo do CNPJ na tela dele e ele explica os motivos antes dos passos', () => {
    expect(getHelpArticles('prestador', 'dashboard-prestador').map((a) => a.id)).toContain('selo-cnpj-prestador')
    const artigo = findHelpArticle('selo-cnpj-prestador')!
    expect(artigo.reasons?.items.length).toBeGreaterThanOrEqual(4)
    const motivos = artigo.reasons!.items.map((i) => `${i.title} ${i.text}`).join(' ')
    expect(motivos).toMatch(/confiança/i)
    expect(motivos).toMatch(/Bronze/)
    expect(motivos).toMatch(/Prata/)
    expect(motivos).toMatch(/remover/i)
  })

  it('não promete o que o sistema não faz: o selo não muda a posição na busca e o CNPJ não aparece para o cliente', () => {
    const tudo = ['selo-cnpj-prestador', 'selos-e-niveis-prestador', 'selos-no-perfil']
      .map((id) => findHelpArticle(id)!)
      .flatMap((a) => [a.summary, ...(a.steps ?? []), ...(a.reasons?.items.flatMap((i) => [i.title, i.text]) ?? [])])
      .join(' ')
    expect(tudo).toMatch(/não muda a posição/i)
    expect(tudo).toMatch(/não (aparecem|exibimos)/i)
    expect(tudo).not.toMatch(/mais clientes|mais contatos|sobe na busca|aparece primeiro/i)
  })

  it('a busca do prestador e a do cliente encontram os artigos de selos', () => {
    expect(searchHelpArticles('CNPJ', 'prestador').map((a) => a.id)).toEqual(expect.arrayContaining(['selo-cnpj-prestador', 'selos-e-niveis-prestador']))
    expect(searchHelpArticles('nível Prata', 'prestador').map((a) => a.id)).toContain('selos-e-niveis-prestador')
    expect(searchHelpArticles('selo', 'cliente').map((a) => a.id)).toContain('selos-no-perfil')
  })

  it('o artigo do cliente aparece no perfil público e não vaza para o prestador', () => {
    expect(getHelpArticles('cliente', 'perfil-publico').map((a) => a.id)).toContain('selos-no-perfil')
    expect(getHelpArticles('prestador').map((a) => a.id)).not.toContain('selos-no-perfil')
  })

  it('os artigos do prestador sobre selos não aparecem para o cliente', () => {
    expect(searchHelpArticles('CNPJ', 'cliente').map((a) => a.id)).not.toContain('selo-cnpj-prestador')
  })
})

describe('ajuda: seguro, CND e níveis Ouro/Diamante', () => {
  it('prestador tem artigos de seguro e CND nas telas de Dados Profissionais', () => {
    const ids = getHelpArticles('prestador', 'painel-dados-cnpj').map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['selo-seguro-prestador', 'selo-cnd-prestador', 'selos-e-niveis-prestador']))
  })

  it('o artigo de seguro deixa claro: vale para qualquer categoria, o PQF não vende seguro e o arquivo é apagado', () => {
    const texto = (findHelpArticle('selo-seguro-prestador')?.steps ?? []).join(' ')
    expect(texto).toMatch(/qualquer profissional|qualquer categoria/i)
    expect(texto).toMatch(/não vende nem indica seguro/i)
    expect(texto).toMatch(/arquivo da apólice é apagado/i)
    expect(texto).toMatch(/30, 15 e 3 dias/)
  })

  it('o artigo de CND explica validade de 180 dias e CPEND', () => {
    const texto = (findHelpArticle('selo-cnd-prestador')?.steps ?? []).join(' ')
    expect(texto).toMatch(/180 dias/)
    expect(texto).toMatch(/CPEND/)
  })

  it('o cliente lê o que Ouro e Diamante significam e o que o selo não promete', () => {
    const texto = (findHelpArticle('selos-no-perfil')?.steps ?? []).join(' ')
    expect(texto).toMatch(/Ouro/)
    expect(texto).toMatch(/Diamante/)
    expect(texto).toMatch(/não diz que um problema específico será coberto/)
    expect(getHelpArticles('cliente', 'perfil-publico').map((a) => a.id)).toContain('selos-no-perfil')
  })

  it('artigos de seguro e CND não aparecem para cliente nem visitante', () => {
    expect(searchHelpArticles('apólice', 'cliente').map((a) => a.id)).not.toContain('selo-seguro-prestador')
    expect(searchHelpArticles('certidão', 'publico').map((a) => a.id)).not.toContain('selo-cnd-prestador')
  })
})
