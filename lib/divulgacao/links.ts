// lib/divulgacao/links.ts

/** Domínio canônico: materiais impressos e imagens nunca podem apontar para um preview da Vercel. */
export const SITE_URL = 'https://procuroquemfaca.com.br'

export function urlCanonicaPerfil(slug: string | null | undefined, id: number | string): string {
  return slug?.trim() ? `${SITE_URL}/${slug.trim()}` : `${SITE_URL}/${String(id)}`
}

/** Versão curta para exibir na arte (sem protocolo). */
export function urlCurta(url: string): string {
  return url.replace(/^https?:\/\//, '')
}

/** (41) 99999-8888 a partir de dígitos; devolve os dígitos se não reconhecer o formato. */
export function formatarTelefone(valor: string | null | undefined): string {
  const d = (valor ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}
