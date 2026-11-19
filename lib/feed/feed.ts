// lib/feed/feed.ts
// Tipos e regras puras do feed de projetos. Sem acesso a banco.

export interface FeedItem {
  projetoId: string
  titulo: string
  descricao: string
  concluidoEm: string | null
  prestador: { id: number; nome: string; slug: string; categoria: string | null; cidade: string | null }
  fotos: string[]
  totalCurtidas: number
  curtidoPorMim: boolean
  seguindo: boolean
  /** O trabalho é de quem está olhando: o card não mostra Seguir nem Curtir. */
  meu: boolean
}

export const ITENS_POR_PAGINA = 12

/** Transforma o que o banco devolve em itens seguros. Item sem foto ou sem prestador é descartado. */
export function normalizarFeed(bruto: unknown): FeedItem[] {
  if (!Array.isArray(bruto)) return []
  const itens: FeedItem[] = []
  for (const x of bruto as Record<string, unknown>[]) {
    const p = (x?.prestador ?? {}) as Record<string, unknown>
    const fotos = Array.isArray(x?.fotos) ? (x.fotos as unknown[]).filter((f): f is string => typeof f === 'string' && f.length > 0) : []
    if (!x?.projeto_id || !p.id || !p.slug || fotos.length === 0) continue
    itens.push({
      projetoId: String(x.projeto_id),
      titulo: String(x.titulo ?? '').trim() || 'Trabalho concluído',
      descricao: String(x.descricao ?? '').trim(),
      concluidoEm: typeof x.concluido_em === 'string' ? x.concluido_em : null,
      prestador: {
        id: Number(p.id), nome: String(p.nome ?? ''), slug: String(p.slug),
        categoria: typeof p.categoria === 'string' ? p.categoria : null,
        cidade: typeof p.cidade === 'string' ? p.cidade : null,
      },
      fotos,
      totalCurtidas: Number(x.total_curtidas) || 0,
      curtidoPorMim: x.curtido_por_mim === true,
      seguindo: x.seguindo === true,
      meu: x.meu === true,
    })
  }
  return itens
}

/** Mensagem que acompanha o link do perfil quando alguém compartilha um trabalho do feed. */
export function textoCompartilharTrabalho(item: Pick<FeedItem, 'titulo' | 'prestador'>): string {
  return `Veja "${item.titulo}", trabalho de ${item.prestador.nome} no Procuro Quem Faça.`
}

export function textoCurtidas(total: number): string {
  if (total <= 0) return 'Seja o primeiro a curtir'
  return total === 1 ? '1 curtida' : `${total} curtidas`
}

/** Mensagem para quem tenta agir sem estar logado. */
export const MENSAGEM_LOGIN_PARA_AGIR = 'Entre na sua conta para curtir trabalhos e seguir prestadores.'

/** Resultado do banco (curtir/seguir) em frase simples. null = deu certo. */
export function mensagemDeResultado(codigo: string | undefined | null): string | null {
  switch (codigo) {
    case undefined: case null: case 'ok': return null
    case 'nao_autenticado': return MENSAGEM_LOGIN_PARA_AGIR
    case 'proprio_perfil': return 'Você não pode seguir o seu próprio perfil.'
    case 'proprio_projeto': return 'Você não pode curtir o seu próprio trabalho.'
    case 'limite_atingido': return 'Você chegou ao limite de 500 perfis seguidos. Deixe de seguir algum para continuar.'
    case 'nao_encontrado': return 'Este trabalho não está mais disponível.'
    case 'nao_e_dono': return 'Só quem registrou este trabalho pode alterar isso.'
    default: return 'Não conseguimos concluir agora. Tente de novo.'
  }
}

/** Atualiza um item depois de curtir/descurtir, sem recarregar o feed. */
export function aplicarCurtida(itens: FeedItem[], projetoId: string, curtido: boolean, total: number): FeedItem[] {
  return itens.map(i => (i.projetoId === projetoId ? { ...i, curtidoPorMim: curtido, totalCurtidas: total } : i))
}

/** Atualiza todos os trabalhos de um prestador depois de seguir/deixar de seguir. */
export function aplicarSeguir(itens: FeedItem[], prestadorId: number, seguindo: boolean): FeedItem[] {
  return itens.map(i => (i.prestador.id === prestadorId ? { ...i, seguindo } : i))
}

// ── Controle "Mostrar no feed" (painel do prestador) ─────────────────────────────

/** Campos do trabalho que decidem se o prestador vê o controle do feed. */
export interface TrabalhoParaFeed {
  status: string
  feed_aceito_em?: string | null
  feed_revogado_em?: string | null
  feed_oculto?: boolean | null
}

export type EstadoNoFeed = 'visivel' | 'oculto' | null

/**
 * null  = o trabalho não pode estar no feed (não finalizado, aceito antes do aviso ou retirado pelo cliente): não mostra controle.
 * visivel/oculto = está elegível; o prestador escolhe.
 */
export function estadoNoFeed(t: TrabalhoParaFeed): EstadoNoFeed {
  if (t.status !== 'finalizado' || !t.feed_aceito_em || t.feed_revogado_em) return null
  return t.feed_oculto ? 'oculto' : 'visivel'
}

/** Troca o campo feed_oculto de um trabalho da lista, sem recarregar. */
export function aplicarFeedOculto<T extends { id: string; feed_oculto?: boolean | null }>(lista: T[], projetoId: string, oculto: boolean): T[] {
  return lista.map(t => (t.id === projetoId ? { ...t, feed_oculto: oculto } : t))
}

// ── "Retirar do feed" (painel do cliente) ────────────────────────────────────────

/** O cliente só vê "Retirar do feed" em trabalho concluído, aceito com o aviso do feed e ainda não retirado. */
export function podeRetirarDoFeed(t: { status: string; feed_aceito_em?: string | null; feed_revogado_em?: string | null }): boolean {
  return t.status?.toLowerCase() === 'finalizado' && !!t.feed_aceito_em && !t.feed_revogado_em
}

/** Marca o trabalho como retirado do feed na lista, sem recarregar. */
export function aplicarRetiradaDoFeed<T extends { id: string; feed_revogado_em?: string | null }>(lista: T[], projetoId: string, quando: string): T[] {
  return lista.map(t => (t.id === projetoId ? { ...t, feed_revogado_em: quando } : t))
}

export const TEXTO_RETIRAR_DO_FEED = 'Este trabalho deixa de aparecer no feed e não volta. Ele continua no perfil do prestador.'
