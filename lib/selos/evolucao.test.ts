// lib/selos/evolucao.test.ts
import { describe, expect, it } from 'vitest'
import { montarConquistas, resumoEvolucao, type ExtrasEvolucao } from './evolucao'

const extras = (o: Partial<ExtrasEvolucao> = {}): ExtrasEvolucao => ({
  experiencia: { servicos: 0, clientes: 0, atingido: false }, tempoCnpj: null, atividadeCompativel: false, ...o,
})
const estado = (c: ReturnType<typeof montarConquistas>, id: string) => c.find((x) => x.id === id)?.estado

describe('montarConquistas', () => {
  it('enquanto os extras não chegaram, os selos calculados ficam "em breve" (e não contam)', () => {
    const c = montarConquistas('sem')
    expect(c.find((x) => x.id === 'cnpj')?.estado).toBe('disponivel')
    expect(c.filter((x) => x.estado === 'em_breve').map((x) => x.id)).toEqual(['experiencia', 'tempo_cnpj', 'atividade'])
  })
  it('mapeia a fase do CNPJ para o estado da conquista', () => {
    expect(montarConquistas('aprovado')[0].estado).toBe('conquistado')
    expect(montarConquistas('em_conferencia')[0].estado).toBe('em_andamento')
    expect(montarConquistas('rejeitado')[0].estado).toBe('disponivel')
    expect(montarConquistas('expirado')[0].estado).toBe('disponivel')
  })

  it('experiência: disponível, em progresso (com o andamento) e conquistada', () => {
    expect(estado(montarConquistas('sem', extras()), 'experiencia')).toBe('disponivel')
    const meio = montarConquistas('sem', extras({ experiencia: { servicos: 4, clientes: 3, atingido: false } }))
    expect(estado(meio, 'experiencia')).toBe('em_progresso')
    expect(meio.find((x) => x.id === 'experiencia')?.detalhe).toBe('3 de 10 clientes diferentes avaliaram seus serviços')
    expect(estado(montarConquistas('sem', extras({ experiencia: { servicos: 10, clientes: 10, atingido: true } })), 'experiencia')).toBe('conquistado')
  })

  it('experiência não depende do CNPJ; tempo e atividade dependem', () => {
    const c = montarConquistas('sem', extras({ experiencia: { servicos: 10, clientes: 10, atingido: true } }))
    expect(estado(c, 'experiencia')).toBe('conquistado')
    expect(estado(c, 'tempo_cnpj')).toBe('depende_cnpj')
    expect(estado(c, 'atividade')).toBe('depende_cnpj')
  })

  it('com CNPJ ativo: tempo conquistado pela faixa, ou "em breve" se tem menos de 1 ano', () => {
    const com = montarConquistas('aprovado', extras({ tempoCnpj: 3 }))
    expect(estado(com, 'tempo_cnpj')).toBe('conquistado')
    expect(com.find((x) => x.id === 'tempo_cnpj')?.detalhe).toBe('CNPJ aberto há mais de 3 anos')
    expect(estado(montarConquistas('aprovado', extras()), 'tempo_cnpj')).toBe('em_breve')
  })

  it('com CNPJ ativo: atividade compatível conquistada, ou "não se aplica" (sem punir)', () => {
    expect(estado(montarConquistas('aprovado', extras({ atividadeCompativel: true })), 'atividade')).toBe('conquistado')
    expect(estado(montarConquistas('aprovado', extras()), 'atividade')).toBe('nao_aplica')
  })
})

describe('resumoEvolucao', () => {
  it('"em breve" não conta no total', () => {
    expect(resumoEvolucao(montarConquistas('sem'))).toEqual({ conquistados: 0, total: 1, percentual: 0, texto: '0 de 1 selo conquistado' })
    expect(resumoEvolucao(montarConquistas('aprovado'))).toEqual({ conquistados: 1, total: 1, percentual: 100, texto: '1 de 1 selo conquistado' })
  })
  it('"não se aplica" e "em breve" ficam fora da conta; "depende do CNPJ" entra', () => {
    // sem CNPJ: cnpj + experiência + tempo + atividade (os dois últimos dependem do CNPJ, mas contam)
    expect(resumoEvolucao(montarConquistas('sem', extras())).total).toBe(4)
    // com CNPJ ativo recente e atividade de outra área: tempo "em breve" e atividade "não se aplica" saem da conta
    expect(resumoEvolucao(montarConquistas('aprovado', extras())).total).toBe(2)
  })
  it('em conferência ainda não é conquista', () => {
    expect(resumoEvolucao(montarConquistas('em_conferencia')).conquistados).toBe(0)
  })
  it('usa plural com mais de um selo e nunca divide por zero', () => {
    const dois = [
      { id: 'a', titulo: 'A', estado: 'conquistado' as const },
      { id: 'b', titulo: 'B', estado: 'disponivel' as const },
    ]
    expect(resumoEvolucao(dois).texto).toBe('1 de 2 selos conquistados')
    expect(resumoEvolucao(dois).percentual).toBe(50)
    expect(resumoEvolucao([]).percentual).toBe(0)
  })
})

describe('atividade compatível: honestidade quando não sabemos conferir', () => {
  const base = { experiencia: { servicos: 0, clientes: 0, atingido: false }, tempoCnpj: null, atividadeCompativel: false }

  it('categoria sem CNAE cadastrado: diz que não sabemos, convida a ajudar e não entra na conta', () => {
    const lista = montarConquistas('aprovado', { ...base, categoriaSemMapeamento: true })
    const atividade = lista.find((c) => c.id === 'atividade')!
    expect(atividade.estado).toBe('nao_sabemos')
    expect(atividade.detalhe).toMatch(/Ainda não sabemos/)
    expect(atividade.acao?.href).toMatch(/^https:\/\/wa\.me\//)
    expect(decodeURIComponent(atividade.acao!.href)).toContain('minha categoria ainda não tem CNAE cadastrado')
    expect(resumoEvolucao(lista).total).toBe(2) // CNPJ e experiência; tempo e atividade não contam
  })

  it('categoria mapeada cujo CNAE não combina continua "não se aplica", sem pedir ajuda', () => {
    const atividade = montarConquistas('aprovado', { ...base, categoriaSemMapeamento: false }).find((c) => c.id === 'atividade')!
    expect(atividade.estado).toBe('nao_aplica')
    expect(atividade.acao).toBeUndefined()
  })

  it('antes do CNPJ ativo continua dependendo do CNPJ (não falamos de mapeamento ainda)', () => {
    const atividade = montarConquistas('sem', { ...base, categoriaSemMapeamento: true }).find((c) => c.id === 'atividade')!
    expect(atividade.estado).toBe('depende_cnpj')
  })
})
