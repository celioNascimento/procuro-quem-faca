// lib/anunciosEntreCards.ts
//
// Regras puras de quais posições da lista mostram anúncio (um a cada 4 cards).
// A decisão de cada posição é estável: não muda quando a lista cresce com "Ver mais".

export const CARDS_POR_ANUNCIO = 4
export const PISO_TAXA_EXIBICAO = 0.65

export type ChavePraca = string // `${cidadeId}::${categoriaId}`

export function chavePracaDe(p: { cidade_id?: string | number | null; categoria_id?: string | number | null }): ChavePraca | null {
  const cidadeId = p.cidade_id ? String(p.cidade_id) : null
  const categoriaId = p.categoria_id ? String(p.categoria_id) : null
  return cidadeId && categoriaId ? `${cidadeId}::${categoriaId}` : null
}

/** Depois de qual card vem um anúncio (4º, 8º, 12º…). */
export function ehPosicaoDeAnuncio(index: number): boolean {
  return (index + 1) % CARDS_POR_ANUNCIO === 0
}

/** Número entre 0 e 1 sempre igual para a mesma chave e a mesma semente (mulberry32 sobre um hash simples). */
export function aleatorioEstavel(chave: string, semente: number): number {
  let h = 2166136261 ^ semente
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let t = (h += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * Esta posição mostra anúncio? Sem anunciante na praça: nunca. Com anunciantes: a primeira posição
 * da praça sempre mostra, e as demais com a taxa (65% no mínimo, subindo com a ocupação das vagas).
 */
export function posicaoTemAnuncio(opts: {
  ocupados: number
  vagasTotais: number
  indiceNaPraca: number
  chave: ChavePraca
  semente: number
}): boolean {
  const { ocupados, vagasTotais, indiceNaPraca, chave, semente } = opts
  if (ocupados <= 0 || vagasTotais <= 0) return false
  if (indiceNaPraca === 0) return true
  const ocupacao = Math.min(1, ocupados / vagasTotais)
  const taxa = PISO_TAXA_EXIBICAO + (1 - PISO_TAXA_EXIBICAO) * ocupacao
  return aleatorioEstavel(`${chave}#${indiceNaPraca}`, semente) < taxa
}
