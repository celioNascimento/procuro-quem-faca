import { describe, expect, it } from 'vitest'
import { itensVisiveis, mensagemDoResultado, normalizarResumoFeed, podeDevolver, podeRemover, rotuloDia, totalNoPeriodo } from './adminFeed'

describe('feed no admin', () => {
  it('só remove o que a equipe ainda pode decidir', () => {
    expect(podeRemover('no_ar')).toBe(true)
    expect(podeRemover('oculto_prestador')).toBe(true)
    expect(podeRemover('aguardando_conclusao')).toBe(true)
    expect(podeRemover('retirado_cliente')).toBe(false)
    expect(podeRemover('removido_admin')).toBe(false)
  })

  it('só devolve o que a própria equipe removeu', () => {
    expect(podeDevolver('removido_admin')).toBe(true)
    expect(podeDevolver('retirado_cliente')).toBe(false)
    expect(podeDevolver('no_ar')).toBe(false)
  })

  it('normaliza o resumo do banco e descarta item quebrado', () => {
    const r = normalizarResumoFeed({
      itens: [
        { projeto_id: 'a', titulo: '  Reforma  ', prestador_id: 3, prestador_nome: 'Ana', prestador_slug: 'ana', cidade: 'Londrina', aceito_em: '2026-11-20T12:00:00Z', total_fotos: 4, situacao: 'no_ar' },
        { projeto_id: 'b', titulo: '', prestador_nome: null, aceito_em: '2026-11-19T12:00:00Z', situacao: 'estranha', motivo_remocao: 'Golpe' },
        { titulo: 'sem id', aceito_em: '2026-11-18T00:00:00Z' },
      ],
      por_dia: [{ dia: '2026-11-19', total: 1 }, { dia: '2026-11-20', total: '2' }, { total: 5 }],
    })
    expect(r.itens).toHaveLength(2)
    expect(r.itens[0]).toMatchObject({ titulo: 'Reforma', prestadorNome: 'Ana', cidade: 'Londrina', totalFotos: 4 })
    expect(r.itens[1]).toMatchObject({ titulo: 'Trabalho sem título', prestadorNome: 'Prestador sem nome', situacao: 'no_ar', motivoRemocao: 'Golpe' })
    expect(r.porDia).toEqual([{ dia: '2026-11-19', total: 1 }, { dia: '2026-11-20', total: 2 }])
  })

  it('resposta vazia ou inválida vira resumo vazio', () => {
    expect(normalizarResumoFeed(null)).toEqual({ itens: [], porDia: [] })
    expect(normalizarResumoFeed('x')).toEqual({ itens: [], porDia: [] })
  })

  it('mensagens simples para cada código do banco', () => {
    expect(mensagemDoResultado('ok')).toBeNull()
    expect(mensagemDoResultado('motivo_obrigatorio')).toMatch(/motivo/)
    expect(mensagemDoResultado('nao_foi_removido_pelo_admin')).toMatch(/cliente/)
    expect(mensagemDoResultado('qualquer_outro')).toMatch(/Tente de novo/)
  })

  it('marca exemplo e esconde por padrão', () => {
    const r = normalizarResumoFeed({ itens: [
      { projeto_id: 'a', aceito_em: '2026-11-20T12:00:00Z', exemplo: true },
      { projeto_id: 'b', aceito_em: '2026-11-20T12:00:00Z' },
    ] })
    expect(r.itens.map((i) => i.exemplo)).toEqual([true, false])
    expect(itensVisiveis(r.itens, false).map((i) => i.projetoId)).toEqual(['b'])
    expect(itensVisiveis(r.itens, true)).toHaveLength(2)
  })

  it('soma o período e formata o dia sem mudar de fuso', () => {
    expect(totalNoPeriodo([{ dia: '2026-11-19', total: 1 }, { dia: '2026-11-20', total: 2 }])).toBe(3)
    expect(rotuloDia('2026-11-20')).toBe('20/11')
  })
})
