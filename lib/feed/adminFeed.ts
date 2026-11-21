// lib/feed/adminFeed.ts
// Regras puras da tela Feed do admin. Sem acesso a banco.

export type SituacaoFeed = 'no_ar' | 'aguardando_conclusao' | 'oculto_prestador' | 'retirado_cliente' | 'removido_admin'

export interface ItemFeedAdmin {
  projetoId: string
  titulo: string
  prestadorId: number
  prestadorNome: string
  prestadorSlug: string | null
  cidade: string | null
  aceitoEm: string
  totalFotos: number
  motivoRemocao: string | null
  situacao: SituacaoFeed
}

export interface DiaFeed { dia: string; total: number }
export interface ResumoFeedAdmin { itens: ItemFeedAdmin[]; porDia: DiaFeed[] }

const SITUACOES: SituacaoFeed[] = ['no_ar', 'aguardando_conclusao', 'oculto_prestador', 'retirado_cliente', 'removido_admin']

export const ROTULO_SITUACAO: Record<SituacaoFeed, string> = {
  no_ar: 'No feed',
  aguardando_conclusao: 'Aceito, ainda em andamento',
  oculto_prestador: 'Oculto pelo prestador',
  retirado_cliente: 'Retirado pelo cliente',
  removido_admin: 'Removido pela equipe',
}

/** Só dá para remover o que a equipe ainda pode decidir: o que o cliente retirou ou a equipe já removeu fica como está. */
export function podeRemover(s: SituacaoFeed): boolean {
  return s === 'no_ar' || s === 'oculto_prestador' || s === 'aguardando_conclusao'
}

export function podeDevolver(s: SituacaoFeed): boolean {
  return s === 'removido_admin'
}

/** Transforma o que o banco devolve em dados seguros. Item sem id ou título vazio ganha texto padrão; dado quebrado é descartado. */
export function normalizarResumoFeed(bruto: unknown): ResumoFeedAdmin {
  const raiz = (bruto ?? {}) as Record<string, unknown>
  const itens: ItemFeedAdmin[] = []
  for (const x of Array.isArray(raiz.itens) ? (raiz.itens as Record<string, unknown>[]) : []) {
    if (!x?.projeto_id || !x.aceito_em) continue
    const situacao = SITUACOES.includes(x.situacao as SituacaoFeed) ? (x.situacao as SituacaoFeed) : 'no_ar'
    itens.push({
      projetoId: String(x.projeto_id),
      titulo: String(x.titulo ?? '').trim() || 'Trabalho sem título',
      prestadorId: Number(x.prestador_id) || 0,
      prestadorNome: String(x.prestador_nome ?? '').trim() || 'Prestador sem nome',
      prestadorSlug: typeof x.prestador_slug === 'string' && x.prestador_slug ? x.prestador_slug : null,
      cidade: typeof x.cidade === 'string' && x.cidade ? x.cidade : null,
      aceitoEm: String(x.aceito_em),
      totalFotos: Number(x.total_fotos) || 0,
      motivoRemocao: typeof x.motivo_remocao === 'string' && x.motivo_remocao ? x.motivo_remocao : null,
      situacao,
    })
  }
  const porDia: DiaFeed[] = []
  for (const d of Array.isArray(raiz.por_dia) ? (raiz.por_dia as Record<string, unknown>[]) : []) {
    if (typeof d?.dia === 'string') porDia.push({ dia: d.dia, total: Number(d.total) || 0 })
  }
  return { itens, porDia }
}

/** Mensagens simples para os códigos que as funções do banco devolvem. */
export function mensagemDoResultado(codigo: string): string | null {
  if (codigo === 'ok') return null
  if (codigo === 'motivo_obrigatorio') return 'Escreva o motivo da remoção. Ele fica registrado.'
  if (codigo === 'nao_esta_no_feed') return 'Este trabalho não está no feed.'
  if (codigo === 'nao_foi_removido_pelo_admin') return 'Só dá para devolver o que a equipe removeu. Retirada feita pelo cliente continua valendo.'
  return 'Não foi possível concluir. Tente de novo.'
}

/** Soma os trabalhos aceitos no período, para o resumo acima do gráfico. */
export function totalNoPeriodo(porDia: DiaFeed[]): number {
  return porDia.reduce((soma, d) => soma + d.total, 0)
}

/** "2026-11-20" vira "20/11", sem passar por fuso (a data já vem no calendário de Brasília). */
export function rotuloDia(dia: string): string {
  const [, mes, d] = dia.split('-')
  return mes && d ? `${d}/${mes}` : dia
}
