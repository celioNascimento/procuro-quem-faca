// lib/buscaFiltros.ts
//
// Regras puras da página de resultados: cidade na busca, filtros em cascata e contagens
// das opções. Sem acesso a dados nem a React — por isso é fácil de testar.

export interface ItemBusca {
  estado_sigla?: string | null
  regiao_id?: string | null
  regiao_nome?: string | null
  cidade_id?: string | null
  cidade_nome?: string | null
  grupo_id?: string | null
  grupo_nome?: string | null
  categoria_id?: string | null
  categoria?: string | null
}

export interface FiltrosAtivos {
  estado: string
  regiao: string
  grupo: string
  categoria: string
  /** Cidade já normalizada (sem acento, minúscula, sem "- UF"). Usada quando só temos o nome
   *  (cidade escrita na busca, link antigo). Vazia = sem restrição. */
  cidade: string
  /** Id da cidade. Quando existe, vale no lugar do nome: duas cidades de estados diferentes
   *  podem ter o mesmo nome e não podem se misturar. */
  cidadeId?: string
}

export function normalizarCidade(valor: string | null | undefined): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+-\s+[a-z]{2}$/i, '')
    .trim()
}

/** "massagista em Maringá" → termo "massagista", cidade "Maringá". */
export function parsearBusca(query: string): { termo: string; cidadeExtraida: string | null } {
  const match = query.match(/^(.+?)\s+em\s+(.+)$/i)
  if (match) return { termo: match[1].trim(), cidadeExtraida: match[2].trim() }
  return { termo: query, cidadeExtraida: null }
}

export type OrigemCidade = 'texto' | 'filtro' | 'salva' | null

/**
 * Qual cidade vale para a busca. Prioridade: escrita na busca > escolhida nos filtros/URL >
 * cidade salva do usuário. A cidade salva só entra se o usuário não ampliou a busca ("Ver
 * outras cidades") nem escolheu estado/região, que são recortes mais amplos.
 */
export function decidirCidade(opts: {
  cidadeDaBusca: string | null
  filtroCidade: string
  filtroEstado: string
  filtroRegiao: string
  ampliar: boolean
  cidadeSalva: string | null | undefined
}): { nome: string | null; origem: OrigemCidade } {
  const { cidadeDaBusca, filtroCidade, filtroEstado, filtroRegiao, ampliar, cidadeSalva } = opts
  if (filtroCidade) return { nome: filtroCidade, origem: 'filtro' }
  if (filtroEstado || filtroRegiao) return { nome: null, origem: null }
  if (cidadeDaBusca) return { nome: cidadeDaBusca, origem: 'texto' }
  if (!ampliar && cidadeSalva) return { nome: cidadeSalva, origem: 'salva' }
  return { nome: null, origem: null }
}

type Condicao = (p: ItemBusca) => boolean

function condicoes(f: FiltrosAtivos) {
  const estado: Condicao    = p => !f.estado    || p.estado_sigla === f.estado
  const regiao: Condicao    = p => !f.regiao    || p.regiao_id === f.regiao
  const cidade: Condicao    = p => f.cidadeId
    ? p.cidade_id === f.cidadeId
    : !f.cidade || normalizarCidade(p.cidade_nome) === f.cidade
  const grupo: Condicao     = p => !f.grupo     || p.grupo_id === f.grupo
  const categoria: Condicao = p => !f.categoria || p.categoria_id === f.categoria
  return { estado, regiao, cidade, grupo, categoria }
}

export function filtrarExibidos<T extends ItemBusca>(base: T[], f: FiltrosAtivos): T[] {
  const c = condicoes(f)
  return base.filter(p => c.estado(p) && c.regiao(p) && c.cidade(p) && c.grupo(p) && c.categoria(p))
}

function contar<T extends ItemBusca, K extends string>(
  lista: T[],
  chave: (p: T) => K | null | undefined,
  nome: (p: T) => string | null | undefined,
) {
  const map = new Map<K, { nome: string; count: number }>()
  for (const p of lista) {
    const k = chave(p)
    const n = nome(p)
    if (!k || !n) continue
    const entry = map.get(k) ?? { nome: n, count: 0 }
    entry.count++
    map.set(k, entry)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([id, { nome, count }]) => ({ id, nome, count }))
}

/**
 * Opções do filtro de cidade, uma por cidade (pelo id). Se duas cidades têm o mesmo nome,
 * o rótulo ganha a sigla do estado ("Santa Helena - PR") para a pessoa saber qual é qual.
 */
export function opcoesDeCidade<T extends ItemBusca>(lista: T[]) {
  const porId = new Map<string, { nome: string; uf: string; count: number }>()
  for (const p of lista) {
    if (!p.cidade_id || !p.cidade_nome) continue
    const atual = porId.get(p.cidade_id) ?? { nome: p.cidade_nome, uf: p.estado_sigla || '', count: 0 }
    atual.count++
    porId.set(p.cidade_id, atual)
  }
  const vezes = new Map<string, number>()
  porId.forEach(({ nome }) => {
    const k = normalizarCidade(nome)
    vezes.set(k, (vezes.get(k) ?? 0) + 1)
  })
  return Array.from(porId.entries())
    .map(([id, { nome, uf, count }]) => ({
      id,
      nome: (vezes.get(normalizarCidade(nome)) ?? 0) > 1 && uf ? `${nome} - ${uf}` : nome,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome))
}

/**
 * Opções de cada filtro com a contagem do que REALMENTE sobraria ao escolhê-la.
 * Segue a hierarquia: o "pai" ignora os filtros dos "filhos" (para dar para trocar de estado
 * mesmo com uma cidade escolhida), e os filhos respeitam os pais.
 *   Estado → Região → Cidade   |   Área → Categoria
 * Local e Área se influenciam: contagens de Área respeitam o local e vice-versa.
 */
export function calcularFacetas<T extends ItemBusca>(base: T[], f: FiltrosAtivos) {
  const c = condicoes(f)
  const area = (p: T) => c.grupo(p) && c.categoria(p)
  const local = (p: T) => c.estado(p) && c.regiao(p) && c.cidade(p)

  const estados = contar(
    base.filter(area),
    p => p.estado_sigla,
    p => p.estado_sigla,
  ).map(({ id, count }) => ({ sigla: id, count }))

  const regioes = contar(
    base.filter(p => c.estado(p) && area(p)),
    p => p.regiao_id,
    p => p.regiao_nome,
  )

  const cidades = opcoesDeCidade(base.filter(p => c.estado(p) && c.regiao(p) && area(p)))

  const grupos = contar(
    base.filter(local),
    p => p.grupo_id,
    p => p.grupo_nome,
  )

  const categorias = contar(
    base.filter(p => local(p) && c.grupo(p)),
    p => p.categoria_id,
    p => p.categoria,
  )

  return { estados, regioes, cidades, grupos, categorias }
}
