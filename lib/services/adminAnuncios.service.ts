// lib/services/adminAnuncios.service.ts

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type Segmentacao = {
  id?: string
  estadoSigla: string
  regiaoId: string
  cidadeId: string
  grupoId: string
  categoriaId: string
  valorCobrado: number
}

export type AnuncioComAnunciante = {
  id: string
  status: boolean
  tipo: string
  titulo: string
  link_destino: string | null
  imagem_url: string | null
  posicao: string
  publico_alvo: string
  status_aprovacao: string
  anunciante_id: string
  data_inicio: string | null
  data_expiracao: string | null
  valor_total: number
  created_at: string
  anunciantes: {
    id: string
    razao_social: string
    whatsapp: string | null
  } | null
  anuncios_segmentacoes: {
    id: string
    estado_sigla: string
    regiao_id: string
    cidade_id: string
    grupo_id: string
    categoria_id: string
    valor_cobrado: number
  }[]
}

export type NovoAnuncioInput = {
  anuncianteId: string
  titulo: string
  linkDestino: string
  imagemUrl: string
  posicao: string
  ativo: boolean
  dataInicio: string | null
  dataExpiracao: string | null
  valorTotal: number
  segmentacoes: Segmentacao[]
}

const POSICOES_VAGA_FIXA = new Set(['topo_busca', 'topo_perfil'])

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

async function contarAnunciosAtivosNaPraca(
  cidadeId: string,
  categoriaId: string,
  posicao: string,
  excluirAnuncioId?: string
) {
  const agora = new Date().toISOString()
  
  // Consulta INVERTIDA: Busca na tabela anúncios cruzando com segmentações
  // Evita bug do PostgREST ao cruzar filtros 'OR' em tabelas estrangeiras
  const { data, error } = await supabase
    .from('anuncios')
    .select('id, anuncios_segmentacoes!inner(cidade_id, categoria_id)')
    .eq('status', true)
    .eq('status_aprovacao', 'aprovado')
    .eq('posicao', posicao)
    .or(`data_inicio.is.null,data_inicio.lte.${agora}`)
    .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`)
    .eq('anuncios_segmentacoes.cidade_id', cidadeId)
    .eq('anuncios_segmentacoes.categoria_id', categoriaId)

  if (error) throw error

  const idsUnicos = new Set(
    (data ?? [])
      .map((a: any) => a.id as string)
      .filter((id: string) => id !== excluirAnuncioId)
  )

  return idsUnicos.size
}

export async function verificarInventarioSegmento(
  cidadeId: string,
  categoriaId: string,
  posicao: string,
  excluirAnuncioId?: string
) {
  try {
    if (POSICOES_VAGA_FIXA.has(posicao)) {
      const ocupados = await contarAnunciosAtivosNaPraca(cidadeId, categoriaId, posicao, excluirAnuncioId)
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

    const agora = new Date().toISOString()
    const { data: anunciosAtivos, error: erroAnuncios } = await supabase
      .from('anuncios')
      .select('id, data_expiracao, anuncios_segmentacoes!inner(cidade_id, categoria_id)')
      .eq('status', true)
      .eq('status_aprovacao', 'aprovado')
      .eq('posicao', posicao)
      .or(`data_inicio.is.null,data_inicio.lte.${agora}`)
      .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`)
      .eq('anuncios_segmentacoes.cidade_id', cidadeId)
      .eq('anuncios_segmentacoes.categoria_id', categoriaId)

    if (erroAnuncios) throw erroAnuncios

    const prestadores = totalPrestadores || 0

    const idsUnicos = new Set(
      (anunciosAtivos ?? [])
        .map((a: any) => a.id as string)
        .filter((id: string) => id !== excluirAnuncioId)
    )
    const ocupados = idsUnicos.size

    // CORREÇÃO: Garante ao menos 1 vaga se a praça tiver qualquer prestador
    const vagasTotais = prestadores === 0 ? 0 : Math.max(1, Math.floor(prestadores / 4))
    const vagasDisponiveis = Math.max(0, vagasTotais - ocupados)

    let proximaExpiracao: string | null = null
    if (anunciosAtivos && anunciosAtivos.length > 0) {
      const datas = anunciosAtivos
        .map((a: any) => a.data_expiracao)
        .filter(Boolean)
        .map((d: string) => new Date(d).getTime())

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

export type ValidacaoSegmentacoes =
  | { ok: true }
  | { ok: false; mensagem: string }

export async function validarSegmentacoesContraInventario(
  segmentacoes: Segmentacao[],
  posicao: string,
  anuncioIdExistente?: string | null,
  dataInicioForm?: string | null
): Promise<ValidacaoSegmentacoes> {
  // Se o anúncio for agendado pro futuro, não bloqueia a criação hoje.
  const agora = new Date()
  const isAgendado = dataInicioForm ? new Date(dataInicioForm) > agora : false
  if (isAgendado) return { ok: true }

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
      anuncioIdExistente ?? undefined
    )

    if (repeticoesNoForm > inventario.vagasDisponiveis) {
      return {
        ok: false,
        mensagem:
          inventario.vagasDisponiveis === 0
            ? `Essa praça já está com todas as vagas ocupadas. Agende a data de início para o futuro ou altere a região.`
            : `Essa praça só tem ${inventario.vagasDisponiveis} vaga(s) disponível(is) para a posição selecionada, mas há ${repeticoesNoForm} segmentação(ões) repetida(s) no formulário.`,
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

  // Consulta INVERTIDA
  const { data, error } = await supabase
    .from('anuncios')
    .select('*, anunciantes(id, razao_social, whatsapp), anuncios_segmentacoes!inner(cidade_id, categoria_id)')
    .eq('status', true)
    .eq('status_aprovacao', 'aprovado')
    .eq('tipo', 'proprio')
    .eq('posicao', posicao)
    .or(`data_inicio.is.null,data_inicio.lte.${agora}`)
    .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`)
    .eq('anuncios_segmentacoes.cidade_id', cidadeId)
    .eq('anuncios_segmentacoes.categoria_id', categoriaId)

  if (error) {
    console.error('Erro ao listar anúncios ativos da praça:', error)
    return []
  }

  const vistos = new Set<string>()
  const anuncios: AnuncioComAnunciante[] = []
  for (const a of data ?? []) {
    if (!vistos.has(a.id)) {
      vistos.add(a.id)
      anuncios.push(a as AnuncioComAnunciante)
    }
  }

  return anuncios
}
