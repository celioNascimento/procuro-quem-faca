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
    })
  }
  return itens
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
