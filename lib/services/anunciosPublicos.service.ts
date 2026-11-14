// lib/services/anunciosPublicos.service.ts
//
// Anúncios lidos pelas páginas PÚBLICAS (busca, perfil, painéis): o que está no ar, quantas vagas a
// praça tem e o registro de impressões/cliques. O painel admin (adminAnuncios.service.ts) reaproveita
// estas funções; o caminho contrário não existe, para código de admin não ir parar no bundle público.

import { createClient } from '@/lib/supabase/client'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import type { Anuncio, AnuncioComAnunciante } from '@/types/ads'

export type { AnuncioComAnunciante }

const supabase = createClient()

const POSICOES_VAGA_FIXA = new Set(['topo_busca', 'topo_perfil', 'dashboard_prestador', 'dashboard_cliente'])

export function periodosSeSobrepoe(
  inicioA: string | null,
  fimA: string | null,
  inicioB: string | null,
  fimB: string | null
): boolean {
  const inicioAMs = inicioA ? new Date(inicioA).getTime() : -Infinity
  const fimAMs = fimA ? new Date(fimA).getTime() : Infinity
  const inicioBMs = inicioB ? new Date(inicioB).getTime() : -Infinity
  const fimBMs = fimB ? new Date(fimB).getTime() : Infinity

  return inicioAMs < fimBMs && inicioBMs < fimAMs
}

export type AnuncioPeriodo = { id: string; data_inicio: string | null; data_expiracao: string | null }

export type AnuncioPeriodoRow = { anuncios: AnuncioPeriodo | null }

type PrestadorInventario = {
  id: string
  nome: string
  categoria: { nome: string } | null
  habilidades: string[] | null
  cidades: { nome: string } | null
}

type AnuncioAtivoRow = {
  id: string
  anuncios: AnuncioComAnunciante | null
}

async function contarAnunciosSobrepostosNaPraca(
  cidadeId: string,
  categoriaId: string,
  posicao: string,
  dataInicioCandidato: string | null,
  dataExpiracaoCandidato: string | null,
  excluirAnuncioId?: string
): Promise<{ ocupados: number; anunciosSobrepostos: AnuncioPeriodo[] }> {
  const { data, error } = await supabase
    .from('anuncios_segmentacoes')
    .select(`anuncios!inner(id, data_inicio, data_expiracao)`)
    .eq('cidade_id', cidadeId)
    .eq('categoria_id', categoriaId)
    .eq('anuncios.status', true)
    .eq('anuncios.status_aprovacao', 'aprovado')
    .eq('anuncios.posicao', posicao)

  if (error) throw error

  const vistos = new Set<string>()
  const anunciosSobrepostos: AnuncioPeriodo[] = []

  for (const row of data ?? []) {
    const { anuncios: a } = row as unknown as AnuncioPeriodoRow
    if (!a || a.id === excluirAnuncioId || vistos.has(a.id)) continue
    vistos.add(a.id)

    if (periodosSeSobrepoe(a.data_inicio, a.data_expiracao, dataInicioCandidato, dataExpiracaoCandidato)) {
      anunciosSobrepostos.push(a)
    }
  }

  return { ocupados: anunciosSobrepostos.length, anunciosSobrepostos }
}

async function contarPrestadoresDaPraca(cidadeId: string, categoriaId: string): Promise<number> {
  const { data: categoria, error: erroCategoria } = await supabase
    .from('categorias')
    .select('nome')
    .eq('id', categoriaId)
    .maybeSingle()

  if (erroCategoria) throw erroCategoria
  if (!categoria?.nome) return 0

  const { data: prestadores, error: erroPrestadores } = await supabase
    .from('prestadores')
    .select('id, nome, categoria:categorias(nome), habilidades, cidades(nome)')
    .eq('status', 'ativo')
    .eq('cidade_id', cidadeId)

  if (erroPrestadores) throw erroPrestadores
  if (!prestadores) return 0

  const normalizados = (prestadores as unknown as PrestadorInventario[]).map((p) => ({
    ...p,
    categoria: p.categoria?.nome || '',
  }))

  const termo = normalizarTermo(categoria.nome, '')
  return filtrarPrestadores(normalizados, termo).length
}

export async function verificarInventarioSegmento(
  cidadeId: string,
  categoriaId: string,
  posicao: string,
  excluirAnuncioId?: string,
  dataInicioCandidato: string | null = new Date().toISOString(),
  dataExpiracaoCandidato: string | null = null
) {
  try {
    if (POSICOES_VAGA_FIXA.has(posicao)) {
      const { ocupados } = await contarAnunciosSobrepostosNaPraca(
        cidadeId,
        categoriaId,
        posicao,
        dataInicioCandidato,
        dataExpiracaoCandidato,
        excluirAnuncioId
      )
      const vagasTotais = 1
      const vagasDisponiveis = Math.max(0, vagasTotais - ocupados)
      return { totalPrestadores: 0, vagasTotais, vagasDisponiveis, ocupados, proximaExpiracao: null }
    }

    const totalPrestadores = await contarPrestadoresDaPraca(cidadeId, categoriaId)

    const { ocupados, anunciosSobrepostos } = await contarAnunciosSobrepostosNaPraca(
      cidadeId,
      categoriaId,
      posicao,
      dataInicioCandidato,
      dataExpiracaoCandidato,
      excluirAnuncioId
    )

    const vagasTotais = Math.floor(totalPrestadores / 4)
    const vagasDisponiveis = Math.max(0, vagasTotais - ocupados)

    let proximaExpiracao: string | null = null
    if (anunciosSobrepostos.length > 0) {
      const datas = anunciosSobrepostos
        .map((a) => a.data_expiracao)
        .filter((d): d is string => Boolean(d))
        .map((d) => new Date(d).getTime())

      if (datas.length > 0) {
        proximaExpiracao = new Date(Math.min(...datas)).toISOString()
      }
    }

    return { totalPrestadores, vagasTotais, vagasDisponiveis, ocupados, proximaExpiracao }
  } catch (e) {
    console.error('Erro ao verificar inventário do segmento:', e)
    return { vagasTotais: 0, vagasDisponiveis: 0, totalPrestadores: 0, ocupados: 0, proximaExpiracao: null }
  }
}

export async function listarAnunciosAtivosPorPraca(
  cidadeId: string,
  categoriaId: string,
  posicao: string
): Promise<AnuncioComAnunciante[]> {
  const agora = new Date().toISOString()

  const { data, error } = await supabase
    .from('anuncios_segmentacoes')
    .select(`
      id,
      anuncios!inner(
        *,
        anunciantes(id, razao_social, whatsapp)
      )
    `)
    .eq('cidade_id', cidadeId)
    .eq('categoria_id', categoriaId)
    .eq('anuncios.status', true)
    .eq('anuncios.status_aprovacao', 'aprovado')
    .eq('anuncios.tipo', 'proprio')
    .eq('anuncios.posicao', posicao)
    .or(`data_inicio.is.null,data_inicio.lte.${agora}`, { foreignTable: 'anuncios' })
    .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`, { foreignTable: 'anuncios' })

  if (error) {
    console.error('Erro ao listar anúncios ativos da praça:', error)
    return []
  }

  const vistos = new Set<string>()
  const anuncios: AnuncioComAnunciante[] = []

  for (const row of data ?? []) {
    const r = row as unknown as AnuncioAtivoRow
    const a = r.anuncios
    if (!a || vistos.has(a.id)) continue
    vistos.add(a.id)

    // r.id é o id da linha de anuncios_segmentacoes (praça exata do match).
    // Necessário para atribuir a métrica à segmentação correta.
    a.segmentacao_id_ativa = r.id

    anuncios.push(a)
  }

  return anuncios
}

export async function registrarMetricaAnuncio(
  anuncioId: string,
  segmentacaoId: string | undefined,
  tipo: 'impressao' | 'clique'
) {
  // Sem segmentacaoId não há como atribuir a métrica à praça correta — descarta.
  if (!anuncioId || !segmentacaoId) return

  try {
    fetch('/api/anuncios/metricas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anuncioId, segmentacaoId, tipo }),
    }).catch((err) => console.error('Erro silencioso ao registrar métrica:', err))
  } catch (error) {
    console.error('Falha ao tentar registrar a métrica do anúncio:', error)
  }
}


/** Anúncio de topo da busca (vaga única): sorteia entre os que estão no ar. null = nenhum. */
export async function buscarAnuncioTopoBusca(): Promise<Anuncio | null> {
  const agora = new Date().toISOString()
  const { data, error } = await supabase
    .from('anuncios')
    .select('*')
    .eq('status', true)
    .eq('status_aprovacao', 'aprovado')
    .eq('posicao', 'topo_busca')
    .or(`data_inicio.is.null,data_inicio.lte.${agora}`)
    .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`)
  if (error || !data || data.length === 0) return null
  return data[Math.floor(Math.random() * data.length)] as Anuncio
}
