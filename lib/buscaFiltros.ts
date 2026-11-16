// lib/buscaFiltros.ts
//
// Regras puras da página de resultados: cidade na busca, filtros em cascata e contagens
// das opções. Sem acesso a dados nem a React — por isso é fácil de testar.
//
// Cidade de um prestador = sede (cidade_id) OU área de atuação (cidades_atendidas, nomes).
// Regra completa em documentacao/docs/10-busca-listagem.md.

export interface ItemBusca {
  estado_sigla?: string | null
  regiao_id?: string | null
  regiao_nome?: string | null
  cidade_id?: string | null
  cidade_nome?: string | null
  cidades_atendidas?: string[] | null
  grupo_id?: string | null
  grupo_nome?: string | null
  categoria_id?: string | null
  categoria?: string | null
}

/** Cidade do catálogo: id, nome e UF. */
export interface CidadeRef {
  id: string
  nome: string
  estado_sigla?: string | null
}

export interface FiltrosAtivos {
  estado: string
  regiao: string
  grupo: string
  categoria: string
  /** Cidade já normalizada (sem acento, minúscula, sem "- UF"). Usada quando só temos o nome
   *  (cidade escrita na busca, link antigo). Vazia = sem restrição. */
  cidade: string
  /** Id da cidade. Quando existe, vale no lugar do nome para a SEDE: duas cidades de estados
   *  diferentes podem ter o mesmo nome e não podem se misturar. */
  cidadeId?: string
}

type Condicao = (p: ItemBusca) => boolean

export function normalizarCidade(valor: string | null | undefined): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+-\s+[a-z]{2}$/i, '')
    .trim()
}

/** Minúscula, sem acento e com espaços simples. Compara nomes de cidade escritos à mão. */
function semAcento(valor: string): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Separa a cidade da busca. Aceita "massagista em Maringá" e "massagista Maringá".
 * Sem o "em", a cidade só é reconhecida se as últimas palavras forem o nome de uma cidade do
 * catálogo; o nome mais longo ganha ("São Paulo" antes de "Paulo"). Quando a cidade existe no
 * catálogo, devolve o nome exatamente como está lá.
 */
export function parsearBusca(
  query: string,
  cidades: CidadeRef[] = [],
): { termo: string; cidadeExtraida: string | null } {
  const nomeDoCatalogo = (nome: string) =>
    cidades.find(c => semAcento(c.nome) === semAcento(nome))?.nome ?? nome

  const match = query.match(/^(.+?)\s+em\s+(.+)$/i)
  if (match) return { termo: match[1].trim(), cidadeExtraida: nomeDoCatalogo(match[2].trim()) }

  const palavras = query.trim().split(/\s+/).filter(Boolean)
  for (let k = palavras.length; k >= 1; k--) {
    const fim = palavras.slice(-k).join(' ')
    const achou = cidades.find(c => semAcento(c.nome) === semAcento(fim))
    if (achou) return { termo: palavras.slice(0, -k).join(' '), cidadeExtraida: achou.nome }
  }
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

/** A cidade em vigor é a SEDE do prestador (pelo id quando existe, senão pelo nome). */
function ehSede(p: ItemBusca, f: FiltrosAtivos): boolean {
  if (f.cidadeId) return p.cidade_id === f.cidadeId
  return Boolean(f.cidade) && normalizarCidade(p.cidade_nome) === f.cidade
}

/** A cidade em vigor está entre as áreas de atuação do prestador (nomes, sem acento). */
function atendeCidade(p: ItemBusca, f: FiltrosAtivos): boolean {
  if (!f.cidade) return false
  return (p.cidades_atendidas ?? []).some(nome => normalizarCidade(nome) === f.cidade)
}

function condicoes(f: FiltrosAtivos) {
  const estado: Condicao    = p => !f.estado    || p.estado_sigla === f.estado
  const regiao: Condicao    = p => !f.regiao    || p.regiao_id === f.regiao
  const cidade: Condicao    = p => (!f.cidade && !f.cidadeId) || ehSede(p, f) || atendeCidade(p, f)
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
 * Opções do filtro de cidade. Cada prestador conta uma vez em cada cidade em que aparece
 * (a sede e as áreas de atuação), então a contagem bate com a lista que a opção mostra.
 * Se duas cidades têm o mesmo nome, o rótulo ganha a sigla do estado ("Santa Helena - PR").
 * O `catalogo` resolve nome → id para as áreas de atuação; sem ele, usa só as sedes da lista.
 */
export function opcoesDeCidade<T extends ItemBusca>(lista: T[], catalogo: CidadeRef[] = []) {
  const cidadePorId = new Map<string, CidadeRef>()
  const idsPorNome = new Map<string, string[]>()

  const cadastrar = (c: CidadeRef) => {
    if (cidadePorId.has(c.id)) return
    cidadePorId.set(c.id, c)
    const chave = normalizarCidade(c.nome)
    idsPorNome.set(chave, [...(idsPorNome.get(chave) ?? []), c.id])
  }
  catalogo.forEach(cadastrar)
  for (const p of lista) {
    if (p.cidade_id && p.cidade_nome) {
      cadastrar({ id: p.cidade_id, nome: p.cidade_nome, estado_sigla: p.estado_sigla })
    }
  }

  const contagem = new Map<string, number>()
  for (const p of lista) {
    const ids = new Set<string>()
    if (p.cidade_id && cidadePorId.has(p.cidade_id)) ids.add(p.cidade_id)
    for (const nome of p.cidades_atendidas ?? []) {
      for (const id of idsPorNome.get(normalizarCidade(nome)) ?? []) ids.add(id)
    }
    ids.forEach(id => contagem.set(id, (contagem.get(id) ?? 0) + 1))
  }

  const vezes = new Map<string, number>()
  Array.from(contagem.keys()).forEach(id => {
    const chave = normalizarCidade(cidadePorId.get(id)?.nome)
    vezes.set(chave, (vezes.get(chave) ?? 0) + 1)
  })

  const opcoes: { id: string; nome: string; count: number }[] = []
  Array.from(contagem.entries()).forEach(([id, count]) => {
    const c = cidadePorId.get(id)
    if (!c) return
    const repetida = (vezes.get(normalizarCidade(c.nome)) ?? 0) > 1
    opcoes.push({
      id,
      nome: repetida && c.estado_sigla ? `${c.nome} - ${c.estado_sigla}` : c.nome,
      count,
    })
  })
  return opcoes.sort((a, b) => b.count - a.count || a.nome.localeCompare(b.nome))
}

/**
 * Opções de cada filtro com a contagem do que REALMENTE sobraria ao escolhê-la.
 * Segue a hierarquia: o "pai" ignora os filtros dos "filhos" (para dar para trocar de estado
 * mesmo com uma cidade escolhida), e os filhos respeitam os pais.
 *   Estado → Região → Cidade   |   Área → Categoria
 * Local e Área se influenciam: contagens de Área respeitam o local e vice-versa.
 */
export function calcularFacetas<T extends ItemBusca>(base: T[], f: FiltrosAtivos, catalogo: CidadeRef[] = []) {
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

  const cidades = opcoesDeCidade(base.filter(p => c.estado(p) && c.regiao(p) && area(p)), catalogo)

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
