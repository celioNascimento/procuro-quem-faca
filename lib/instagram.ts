// lib/instagram.ts
//
// Instagram do prestador. Guardamos SÓ o nome de usuário (sem @ e sem link) e montamos o endereço aqui:
// o link que o cliente toca é sempre instagram.com/<usuario>, nunca um endereço digitado por terceiros.
// A mesma regra está na constraint prestadores_instagram_formato (migração 20261119180000).

export type ResultadoInstagram =
  | { ok: true; usuario: string | null } // usuario null = campo vazio (é opcional)
  | { ok: false; motivo: string }

export const MENSAGEM_INSTAGRAM_INVALIDO =
  'Digite só o seu @ do Instagram (ex.: @seunome) ou cole o link do seu perfil.'

/** 1 a 30 letras, números, ponto e sublinhado; sem ponto no fim nem dois pontos seguidos. */
const FORMATO = /^[a-z0-9_](?:[a-z0-9._]{0,28}[a-z0-9_])?$/

/** Endereços do Instagram que não são perfil (post, reel, explorar…): se vierem num link, é link errado. */
const NAO_E_PERFIL = new Set([
  'p', 'reel', 'reels', 'tv', 'stories', 'explore', 'accounts', 'direct', 'about', 'legal', 'privacy', 'developer', 'web',
])

export function usuarioDeInstagramValido(usuario: string): boolean {
  return FORMATO.test(usuario) && !usuario.includes('..')
}

export function normalizarInstagram(entrada: string | null | undefined): ResultadoInstagram {
  const texto = (entrada ?? '').trim()
  if (!texto) return { ok: true, usuario: null }

  let candidato = texto
  const comoLink = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(.*)$/i.exec(texto)
  if (comoLink) {
    candidato = comoLink[1].split(/[/?#]/)[0] ?? ''
  } else if (/[/\s:]/.test(texto)) {
    return { ok: false, motivo: MENSAGEM_INSTAGRAM_INVALIDO } // outro site, texto com espaço etc.
  }

  const usuario = candidato.replace(/^@/, '').toLowerCase()
  if (!usuario || NAO_E_PERFIL.has(usuario) || !usuarioDeInstagramValido(usuario)) {
    return { ok: false, motivo: MENSAGEM_INSTAGRAM_INVALIDO }
  }
  return { ok: true, usuario }
}

export function enderecoDoInstagram(usuario: string): string {
  return `https://www.instagram.com/${usuario}/`
}

export function arrobaDoInstagram(usuario: string): string {
  return `@${usuario}`
}
