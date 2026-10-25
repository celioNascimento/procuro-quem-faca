import { describe, it, expect } from 'vitest'
import { combinarAnunciosComMetricas } from './metricasAnunciosStats'
import type { AnuncioParaMetricas, MetricaDiariaApi } from '@/lib/services/adminAnunciosMetricas.service'

function anuncio(overrides: Partial<AnuncioParaMetricas>): AnuncioParaMetricas {
  return {
    id: '1',
    titulo: 'Anúncio Teste',
    posicao: 'topo_busca',
    status: true,
    data_expiracao: null,
    anunciantes: { razao_social: 'Loja Teste' },
    ...overrides,
  }
}

describe('combinarAnunciosComMetricas', () => {
  it('soma impressões/cliques do período e calcula o CTR', () => {
    const metricas: MetricaDiariaApi[] = [
      { anuncio_id: '1', data_referencia: '2026-10-20', impressoes: 100, cliques: 10 },
      { anuncio_id: '1', data_referencia: '2026-10-21', impressoes: 50, cliques: 5 },
    ]
    const [resultado] = combinarAnunciosComMetricas([anuncio({ id: '1' })], metricas)

    expect(resultado.total_impressoes).toBe(150)
    expect(resultado.total_cliques).toBe(15)
    expect(resultado.ctr).toBeCloseTo(10, 5) // 15/150 * 100
    expect(resultado.metricas_diarias).toHaveLength(2)
  })

  it('CTR é 0 (sem dividir por zero) quando não há impressões', () => {
    const [resultado] = combinarAnunciosComMetricas([anuncio({ id: '1' })], [])

    expect(resultado.total_impressoes).toBe(0)
    expect(resultado.total_cliques).toBe(0)
    expect(resultado.ctr).toBe(0)
    expect(resultado.metricas_diarias).toEqual([])
  })

  it('ignora métricas de um anuncio_id que não está na lista de anúncios', () => {
    const metricas: MetricaDiariaApi[] = [
      { anuncio_id: 'outro-id', data_referencia: '2026-10-20', impressoes: 100, cliques: 10 },
    ]
    const [resultado] = combinarAnunciosComMetricas([anuncio({ id: '1' })], metricas)

    expect(resultado.total_impressoes).toBe(0)
    expect(resultado.total_cliques).toBe(0)
  })

  it('usa o título como fallback quando o anunciante não tem razao_social', () => {
    const [resultado] = combinarAnunciosComMetricas(
      [anuncio({ id: '1', titulo: 'Banner Principal', anunciantes: null })],
      []
    )
    expect(resultado.anunciante_nome).toBe('Banner Principal')
  })

  it('lê razao_social quando anunciantes vem como array (join do Supabase)', () => {
    const [resultado] = combinarAnunciosComMetricas(
      [anuncio({ id: '1', anunciantes: [{ razao_social: 'Loja via Array' }] })],
      []
    )
    expect(resultado.anunciante_nome).toBe('Loja via Array')
  })

  it('ordena por engajamento total (impressões + cliques) decrescente', () => {
    const anuncios = [anuncio({ id: 'baixo' }), anuncio({ id: 'alto' }), anuncio({ id: 'medio' })]
    const metricas: MetricaDiariaApi[] = [
      { anuncio_id: 'baixo', data_referencia: '2026-10-20', impressoes: 10, cliques: 1 },
      { anuncio_id: 'alto', data_referencia: '2026-10-20', impressoes: 1000, cliques: 100 },
      { anuncio_id: 'medio', data_referencia: '2026-10-20', impressoes: 100, cliques: 10 },
    ]

    const resultado = combinarAnunciosComMetricas(anuncios, metricas)

    expect(resultado.map((a) => a.id)).toEqual(['alto', 'medio', 'baixo'])
  })

  it('em empate de engajamento total, desempata por total de cliques', () => {
    const anuncios = [anuncio({ id: 'menos-cliques' }), anuncio({ id: 'mais-cliques' })]
    const metricas: MetricaDiariaApi[] = [
      // Mesmo total (impressões + cliques = 110), mas distribuído diferente
      { anuncio_id: 'menos-cliques', data_referencia: '2026-10-20', impressoes: 100, cliques: 10 },
      { anuncio_id: 'mais-cliques', data_referencia: '2026-10-20', impressoes: 50, cliques: 60 },
    ]

    const resultado = combinarAnunciosComMetricas(anuncios, metricas)

    expect(resultado.map((a) => a.id)).toEqual(['mais-cliques', 'menos-cliques'])
  })
})
