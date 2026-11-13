// lib/vitrine/vitrine.ts
//
// A "Vitrine de fotos" é a galeria simples do profissional (até 5 fotos, sem cliente). Ela é
// diferente dos "Trabalhos": um trabalho passa pelo ciclo prestador-cliente (aceite e avaliação) e
// só ele conta como confirmado. Por isso, no perfil público, a vitrine sempre aparece como
// "fotos enviadas pelo profissional".

export const MAX_FOTOS_VITRINE = 5
export const MAX_TITULO_VITRINE = 60
export const TITULO_PADRAO_VITRINE = 'Fotos do profissional'

export interface Vitrine {
  titulo: string
  fotos: string[]
}

/** Limpa os dados antes de gravar: título sem espaços nas pontas e até 60 letras, no máximo 5 fotos. */
export function normalizarVitrine(entrada: { titulo?: string | null; fotos?: (string | null | undefined)[] | null }): Vitrine {
  const fotos = (entrada.fotos ?? [])
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .slice(0, MAX_FOTOS_VITRINE)
  return { titulo: (entrada.titulo ?? '').trim().slice(0, MAX_TITULO_VITRINE), fotos }
}

/** Título mostrado ao público: o que o profissional escreveu ou, se não escreveu nada, o padrão. */
export function tituloDaVitrine(titulo?: string | null): string {
  return (titulo ?? '').trim() || TITULO_PADRAO_VITRINE
}

export function fotosRestantes(fotos: string[]): number {
  return Math.max(0, MAX_FOTOS_VITRINE - fotos.length)
}
