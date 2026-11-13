// lib/catalogo/exemploCategoria.ts
//
// Exemplo de descrição de uma categoria (`categorias.exemplo_descricao`): uma frase curta do que foi
// feito, no tom do ofício. Aparece como sugestão no campo "Depois" da tela de novo trabalho.
//
// REGRA DO CATÁLOGO: toda categoria nova precisa de exemplo. O formulário de /admin/habilidades exige.

export const MIN_EXEMPLO = 15
export const MAX_EXEMPLO = 140

export type ResultadoDoExemplo = { ok: true; valor: string } | { ok: false; erro: string }

export function validarExemploDeCategoria(texto: string | null | undefined): ResultadoDoExemplo {
  const valor = (texto ?? '').replace(/\s+/g, ' ').trim()
  if (!valor) return { ok: false, erro: 'Escreva o exemplo de descrição. Toda categoria precisa de um.' }
  if (valor.length < MIN_EXEMPLO) return { ok: false, erro: `O exemplo está curto demais. Escreva uma frase de pelo menos ${MIN_EXEMPLO} letras.` }
  if (valor.length > MAX_EXEMPLO) return { ok: false, erro: `O exemplo está longo demais. Use no máximo ${MAX_EXEMPLO} letras.` }
  return { ok: true, valor }
}

/** Categorias que ainda não têm exemplo (o painel avisa quais são). */
export function categoriasSemExemplo<T extends { exemplo_descricao?: string | null }>(categorias: T[]): T[] {
  return categorias.filter((c) => !(c.exemplo_descricao ?? '').trim())
}
