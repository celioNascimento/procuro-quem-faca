// lib/services/adminAnuncios.service.ts

import { createClient } from '@/lib/supabase/client'
import type { Segmentacao, AnuncioComAnunciante, NovoAnuncioInput, ValidacaoSegmentacoes } from '@/types/ads'

export type { Segmentacao, AnuncioComAnunciante, NovoAnuncioInput, ValidacaoSegmentacoes }

const supabase = createClient()

const POSICOES_VAGA_FIXA = new Set(['topo_busca', 'topo_perfil', 'dashboard_prestador', 'dashboard_cliente'])

export async function criarAnuncio(input: NovoAnuncioInput) {
  if (input.segmentacoes.length === 0) {
    throw new Error('É necessária ao menos uma segmentação (estado, região, cidade, grupo e categoria).')
  }

  const { data: anuncio, error } = await supabase
    .from('anuncios')
    .insert({
      anunciante_id: input.anuncianteId,
      titulo: input.titulo,
      link_destino: input.linkDestino,
      imagem_url: input.imagemUrl,
      posicao: input.posicao,
      tipo: 'proprio',
      status: input.ativo,
      data_inicio: input.dataInicio,
      data_expiracao: input.dataExpiracao,
      valor_total: input.valorTotal,
      status_aprovacao: 'aprovado',
      publico_alvo: 'todos',
    })
    .select()
    .single()

  if (error) throw error

  const { error: erroSegmentacoes } = await supabase.from('anuncios_segmentacoes').insert(
    input.segmentacoes.map((s) => ({
      anuncio_id: anuncio.id,
      estado_sigla: s.estadoSigla,
      regiao_id: s.regiaoId,
      cidade_id: s.cidadeId,
      grupo_id: s.grupoId,
      categoria_id: s.categoriaId,
      valor_cobrado: s.valorCobrado,
    }))
  )

  if (erroSegmentacoes) {
    await supabase.from('anuncios').delete().eq('id', anuncio.id)
    throw erroSegmentacoes
  }

  return anuncio
}

export async function atualizarAnuncio(
  id: string,
  input: Partial<Omit<NovoAnuncioInput, 'segmentacoes' | 'anuncianteId'>>,
  novasSegmentacoes?: Segmentacao[]
) {
  const payload: Record<string, unknown> = {}
  if (input.titulo !== undefined) payload.titulo = input.titulo
  if (input.linkDestino !== undefined) payload.link_destino = input.linkDestino
  if (input.imagemUrl !== undefined) payload.imagem_url = input.imagemUrl
  if (input.posicao !== undefined) payload.posicao = input.posicao
  if (input.ativo !== undefined) payload.status = input.ativo
  if (input.dataInicio !== undefined) payload.data_inicio = input.dataInicio
  if (input.dataExpiracao !== undefined) payload.data_expiracao = input.dataExpiracao
  if (input.valorTotal !== undefined) payload.valor_total = input.valorTotal

  const { data, error } = await supabase.from('anuncios').update(payload).eq('id', id).select().single()
  if (error) throw error

  if (novasSegmentacoes) {
    if (novasSegmentacoes.length === 0) {
      throw new Error('É necessária ao menos uma segmentação (estado, região, cidade, grupo e categoria).')
    }

    const { error: erroDelete } = await supabase.from('anuncios_segmentacoes').delete().eq('anuncio_id', id)
    if (erroDelete) throw erroDelete

    const { error: erroInsert } = await supabase.from('anuncios_segmentacoes').insert(
      novasSegmentacoes.map((s) => ({
        anuncio_id: id,
        estado_sigla: s.estadoSigla,
        regiao_id: s.regiaoId,
        cidade_id: s.cidadeId,
        grupo_id: s.grupoId,
        categoria_id: s.categoriaId,
        valor_cobrado: s.valorCobrado,
      }))
    )
    if (erroInsert) throw erroInsert
  }

  return data
}

export async function alternarStatusAnuncio(id: string, ativo: boolean) {
  const { data, error } = await supabase.from('anuncios').update({ status: ativo }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function excluirAnuncio(id: string) {
  const { error } = await supabase.from('anuncios').delete().eq('id', id)
  if (error) throw error
}

export async function listarAnuncios(): Promise<AnuncioComAnunciante[]> {
  const { data, error } = await supabase
    .from('anuncios')
    .select('*, anunciantes(id, razao_social, whatsapp), anuncios_segmentacoes(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AnuncioComAnunciante[]
}

export async function criarOuBuscarAnunciante(input: {
  email: string
  razaoSocial: string
  cnpjCpf?: string
  whatsapp?: string
}) {
  const res = await fetch('/api/admin/anunciantes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro ao criar anunciante')
  return data as { anunciante: any; senhaTemporaria: string | null; novoUsuario: boolean }
}

export async function uploadBannerAnuncio(file: File, anuncianteId: string) {
  const extensao = file.name.split('.').pop()
  const nomeArquivo = `${anuncianteId}/${Date.now()}.${extensao}`

  const { error } = await supabase.storage.from('anuncios-banners').upload(nomeArquivo, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data: urlData } = supabase.storage.from('anuncios-banners').getPublicUrl(nomeArquivo)
  return urlData.publicUrl
}

export async function listarEstados() {
  const { data, error } = await supabase.from('estados').select('sigla, nome').order('nome')
  if (error) throw error
  return data
}

export async function listarRegioesPorEstado(estadoSigla: string) {
  const { data, error } = await supabase.from('regioes').select('id, nome').eq('estado_sigla', estadoSigla).order('nome')
  if (error) throw error
  return data
}

export async function listarCidadesPorRegiao(regiaoId: string) {
  const { data, error } = await supabase.from('cidades').select('id, nome').eq('regiao_id', regiaoId).eq('ativa', true).order('nome')
  if (error) throw error
  return data
}

export async function listarGrupos() {
  const { data, error } = await supabase.from('categorias_grupos').select('id, nome').order('ordem')
  if (error) throw error
  return data
}

export async function listarCategoriasPorGrupo(grupoId: string) {
  const { data, error } = await supabase.from('categorias').select('id, nome').eq('grupo_id', grupoId).order('nome')
  if (error) throw error
  return data
}

function periodosSeSobrepoe(
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

type AnuncioPeriodo = { id: string; data_inicio: string | null; data_expiracao: string | null }

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
    const a = (row as any).anuncios as AnuncioPeriodo
    if (!a || a.id === excluirAnuncioId || vistos.has(a.id)) continue
    vistos.add(a.id)

    if (periodosSeSobrepoe(a.data_inicio, a.data_expiracao, dataInicioCandidato, dataExpiracaoCandidato)) {
      anunciosSobrepostos.push(a)
    }
  }

  return { ocupados: anunciosSobrepostos.length, anunciosSobrepostos }
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

    const { count: totalPrestadores, error: erroPrestadores } = await supabase
      .from('prestadores')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')
      .eq('cidade_id', cidadeId)
      .eq('categoria_id', categoriaId)

    if (erroPrestadores) throw erroPrestadores

    const { ocupados, anunciosSobrepostos } = await contarAnunciosSobrepostosNaPraca(
      cidadeId,
      categoriaId,
      posicao,
      dataInicioCandidato,
      dataExpiracaoCandidato,
      excluirAnuncioId
    )

    const prestadores = totalPrestadores || 0
    const vagasTotais = Math.floor(prestadores / 4)
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

    return { totalPrestadores: prestadores, vagasTotais, vagasDisponiveis, ocupados, proximaExpiracao }
  } catch (e) {
    console.error('Erro ao verificar inventário do segmento:', e)
    return { vagasTotais: 0, vagasDisponiveis: 0, totalPrestadores: 0, ocupados: 0, proximaExpiracao: null }
  }
}

export async function validarSegmentacoesContraInventario(
  segmentacoes: Segmentacao[],
  posicao: string,
  anuncioIdExistente?: string | null,
  dataInicio: string | null = null,
  dataExpiracao: string | null = null
): Promise<ValidacaoSegmentacoes> {
  const contagemNoForm = new Map<string, number>()
  for (const s of segmentacoes) {
    const chave = `${s.cidadeId}::${s.categoriaId}`
    contagemNoForm.set(chave, (contagemNoForm.get(chave) ?? 0) + 1)
  }

  const pracasJaChecadas = new Set<string>()

  for (const s of segmentacoes) {
    const chave = `${s.cidadeId}::${s.categoriaId}`
    if (pracasJaChecadas.has(chave)) continue
    pracasJaChecadas.add(chave)

    const repeticoesNoForm = contagemNoForm.get(chave) ?? 1

    const inventario = await verificarInventarioSegmento(
      s.cidadeId,
      s.categoriaId,
      posicao,
      anuncioIdExistente ?? undefined,
      dataInicio ?? new Date().toISOString(),
      dataExpiracao
    )

    if (repeticoesNoForm > inventario.vagasDisponiveis) {
      return {
        ok: false,
        mensagem:
          inventario.vagasDisponiveis === 0
            ? `Essa praça (cidade + categoria) já está com todas as vagas ocupadas nesse período para a posição selecionada.`
            : `Essa praça só tem ${inventario.vagasDisponiveis} vaga(s) disponível(is) nesse período para a posição selecionada, mas há ${repeticoesNoForm} segmentação(ões) repetida(s) para ela no formulário.`,
      }
    }
  }

  return { ok: true }
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
    const a = (row as any).anuncios
    if (!a || vistos.has(a.id)) continue
    vistos.add(a.id)
    
    a.segmentacao_id_ativa = (row as any).id
    
    anuncios.push(a)
  }

  return anuncios
}

export async function registrarMetricaAnuncio(
  anuncioId: string,
  segmentacaoId: string | undefined,
  tipo: 'impressao' | 'clique'
) {
  try {
    fetch('/api/anuncios/metricas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anuncioId, segmentacaoId, tipo })
    }).catch((err) => console.error('Erro silencioso ao registrar métrica:', err))
  } catch (error) {
    console.error('Falha ao tentar registrar a métrica do anúncio:', error)
  }
}
