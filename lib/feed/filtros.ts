// lib/feed/filtros.ts
// Filtros do feed (tipo de serviço e cidade) guardados no endereço da página: dá para compartilhar o link,
// voltar e recarregar sem perder o filtro. Regras puras, sem acesso a banco nem ao navegador.

export interface FiltrosFeed {
  categoriaId: string | null
  cidadeId: string | null
  /** Sigla do estado (UF), ex.: "PR". */
  estado: string | null
}

export interface CidadeDoFeed { id: string; nome: string; estadoSigla: string | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Só aceita UUID: um link adulterado ("?cidade=abc") vira "sem filtro" em vez de erro no banco. */
export function idValido(valor: string | null | undefined): string | null {
  const v = (valor ?? '').trim()
  return UUID.test(v) ? v : null
}

/** Só aceita duas letras ("pr" vira "PR"); qualquer outra coisa vira "sem filtro". */
export function estadoValido(valor: string | null | undefined): string | null {
  const v = (valor ?? '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(v) ? v : null
}

export function lerFiltrosDaUrl(params: { get(nome: string): string | null }): FiltrosFeed {
  return {
    categoriaId: idValido(params.get('categoria')),
    cidadeId: idValido(params.get('cidade')),
    estado: estadoValido(params.get('estado')),
  }
}

/** Endereço com os filtros aplicados ("/feed", "/feed?cidade=…&categoria=…"). */
export function montarEnderecoDoFeed(caminho: string, filtros: FiltrosFeed): string {
  const q = new URLSearchParams()
  if (filtros.categoriaId) q.set('categoria', filtros.categoriaId)
  if (filtros.estado) q.set('estado', filtros.estado)
  if (filtros.cidadeId) q.set('cidade', filtros.cidadeId)
  const texto = q.toString()
  return texto ? `${caminho}?${texto}` : caminho
}

export function temFiltroAtivo(f: FiltrosFeed): boolean {
  return f.categoriaId !== null || f.cidadeId !== null || f.estado !== null
}

/** Converte a resposta do banco (feed_cidades). Item sem id ou nome é descartado. */
export function normalizarCidadesDoFeed(bruto: unknown): CidadeDoFeed[] {
  if (!Array.isArray(bruto)) return []
  const out: CidadeDoFeed[] = []
  for (const x of bruto as Record<string, unknown>[]) {
    const id = idValido(typeof x?.id === 'string' ? x.id : null)
    const nome = typeof x?.nome === 'string' ? x.nome.trim() : ''
    if (!id || !nome) continue
    out.push({ id, nome, estadoSigla: typeof x.estado_sigla === 'string' && x.estado_sigla ? x.estado_sigla : null })
  }
  return out
}

/** "Londrina - PR" (ou só o nome, sem estado). */
export function rotuloDaCidade(c: CidadeDoFeed): string {
  return c.estadoSigla ? `${c.nome} - ${c.estadoSigla}` : c.nome
}

/** Estados que têm trabalho no feed, em ordem alfabética (sem repetir). */
export function estadosDoFeed(cidades: CidadeDoFeed[]): string[] {
  return [...new Set(cidades.map(c => c.estadoSigla).filter((e): e is string => !!e))].sort()
}

/** Cidades da lista; com estado escolhido, só as daquele estado. */
export function cidadesDoEstado(cidades: CidadeDoFeed[], estado: string | null): CidadeDoFeed[] {
  return estado ? cidades.filter(c => c.estadoSigla === estado) : cidades
}

/** Ao trocar o estado, a cidade escolhida só continua se ela for daquele estado. */
export function filtrosAoTrocarEstado(atuais: FiltrosFeed, estado: string | null, cidades: CidadeDoFeed[]): FiltrosFeed {
  const cidade = cidades.find(c => c.id === atuais.cidadeId)
  const mantem = !estado || (cidade !== undefined && cidade.estadoSigla === estado)
  return { ...atuais, estado, cidadeId: mantem ? atuais.cidadeId : null }
}
