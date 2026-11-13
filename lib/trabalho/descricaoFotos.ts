// lib/trabalho/descricaoFotos.ts
//
// Textos de ajuda das fotos de um trabalho (Antes, Durante, Depois). A descrição de cada foto é
// opcional: ajuda o cliente a avaliar, mas nunca trava o prestador. O exemplo do campo "Depois" é
// da categoria do prestador (`categorias.exemplo_descricao`, editado em /admin/habilidades); quem
// tem categoria sem exemplo vê uma frase neutra.

export type EtapaFoto = 1 | 2 | 3

export const NOME_DA_ETAPA: Record<EtapaFoto, string> = { 1: 'Antes', 2: 'Durante', 3: 'Depois' }
// Texto público de uma foto sem descrição (com a preposição certa em cada etapa).
const TEXTO_PADRAO_DA_ETAPA: Record<EtapaFoto, string> = {
  1: 'Antes do serviço',
  2: 'Durante o serviço',
  3: 'Depois do serviço',
}

export const SUBTITULO_DA_ETAPA: Record<EtapaFoto, string> = {
  1: 'Como estava antes de começar',
  2: 'O trabalho em andamento',
  3: 'O resultado final',
}

export const FRASE_NEUTRA = 'Conte em uma frase o que foi feito.'
export const LIMITE_DESCRICAO = 300

/** Dica que aparece no campo de descrição, no lugar do texto digitado. */
export function dicaDaDescricao(etapa: EtapaFoto, exemploDaCategoria?: string | null): string {
  if (etapa === 1) return 'Como estava antes de começar?'
  if (etapa === 2) return 'O que está sendo feito?'
  const exemplo = (exemploDaCategoria ?? '').trim()
  return exemplo ? `Ex.: ${exemplo}` : FRASE_NEUTRA
}

/** Texto mostrado ao público e ao cliente: a descrição escrita ou, se não houver, o nome da etapa. */
export function descricaoOuPadrao(etapa: number, legenda?: string | null): string {
  const escrita = (legenda ?? '').trim()
  if (escrita) return escrita
  return TEXTO_PADRAO_DA_ETAPA[etapa as EtapaFoto] ?? 'Foto do serviço'
}

/** Corta a descrição no limite e tira espaços das pontas. */
export function limparDescricao(texto: string): string {
  return texto.trim().slice(0, LIMITE_DESCRICAO)
}
