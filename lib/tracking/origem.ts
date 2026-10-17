// lib/tracking/origem.ts
//
// Descobre DE ONDE o visitante veio (origem) e de QUAL campanha, a partir de:
//   1) cookie 'pqf_origem' (será gravado na Tarefa 4, ao abrir um link com utm)
//   2) endereço da página de onde o clique saiu (Referer), que ainda contém ?utm_...
//   3) se nada for encontrado: origem = 'direto'
// Todo texto é normalizado (minúsculo, sem acento, sem caracteres especiais) para
// 'Meta', 'meta' e 'META' contarem como a mesma origem.
// Funções puras: não acessam banco nem rede.

export const COOKIE_ORIGEM = 'pqf_origem'
export const MAX_ORIGEM = 60
export const MAX_CAMPANHA = 100

export interface OrigemCampanha {
  origem: string | null
  campanha: string | null
}

const vazio = (): OrigemCampanha => ({ origem: null, campanha: null })

export function normalizarTexto(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null
  const limpo = valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^a-z0-9._\- ]/g, '')    // remove caracteres especiais
    .replace(/\s+/g, '-')
    .slice(0, max)
  return limpo.length > 0 ? limpo : null
}

export function extrairOrigemDeUrl(url: string | null | undefined): OrigemCampanha {
  if (!url) return vazio()
  try {
    const params = new URL(url).searchParams
    return {
      origem: normalizarTexto(params.get('utm_source') ?? params.get('src'), MAX_ORIGEM),
      campanha: normalizarTexto(params.get('utm_campaign'), MAX_CAMPANHA),
    }
  } catch {
    return vazio()
  }
}

function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}

// Formato do cookie: JSON {"o":"meta","c":"gleba-palhano"} (codificado para URL)
export function extrairOrigemDeCookie(valor: string | null | undefined): OrigemCampanha {
  if (!valor) return vazio()
  try {
    const bruto = JSON.parse(decodificar(valor)) as { o?: unknown; c?: unknown } | null
    return {
      origem: normalizarTexto(bruto?.o, MAX_ORIGEM),
      campanha: normalizarTexto(bruto?.c, MAX_CAMPANHA),
    }
  } catch {
    return vazio()
  }
}

export function resolverOrigem(entrada: {
  cookie?: string | null
  referer?: string | null
}): OrigemCampanha {
  const doCookie = extrairOrigemDeCookie(entrada.cookie)
  if (doCookie.origem) return doCookie

  const daUrl = extrairOrigemDeUrl(entrada.referer)
  if (daUrl.origem) return daUrl

  return { origem: 'direto', campanha: null }
}
