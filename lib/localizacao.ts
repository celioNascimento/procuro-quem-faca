// lib/localizacao.ts
//
// Descobrir a cidade do usuário a partir da posição do aparelho, e lembrar que ele
// dispensou o convite. Só roda quando a pessoa toca em "Usar minha localização".
// As coordenadas vão ao OpenStreetMap (Nominatim) apenas para saber a cidade e NÃO são
// guardadas — fica só a cidade (cookie de 30 dias). Isso é o que a Política de Privacidade promete.

import { supabase } from '@/lib/supabase'

export interface CidadeSelecionada {
  id: string
  nome: string
}

/** Tira "cidade" e "estado" da resposta do Nominatim. */
export function extrairCidadeDoNominatim(resposta: unknown): { nome: string; estado: string | null } | null {
  const endereco = (resposta as { address?: Record<string, unknown> } | null)?.address
  if (!endereco) return null

  const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const nome = texto(endereco.city) ?? texto(endereco.town) ?? texto(endereco.municipality)
  if (!nome) return null

  const bruto = texto(endereco.state_code) ?? texto(endereco['ISO3166-2-lvl4'])
  const estado = bruto ? bruto.replace('BR-', '') : null
  return { nome, estado }
}

/** Posição → cidade atendida pelo PQF. `null` quando não achamos (cidade ainda não ativa, sem rede...). */
export async function descobrirCidade(latitude: number, longitude: number): Promise<CidadeSelecionada | null> {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '10',
    'accept-language': 'pt-BR',
  })
  const resposta = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`)
  const local = extrairCidadeDoNominatim(await resposta.json())
  if (!local) return null

  let consulta = supabase
    .from('cidades')
    .select('id, nome, estado_sigla')
    .eq('ativa', true)
    .ilike('nome', local.nome)
    .limit(5)
  if (local.estado) consulta = consulta.eq('estado_sigla', local.estado)

  const { data } = await consulta
  const cidade = data?.[0]
  return cidade ? { id: String(cidade.id), nome: cidade.nome } : null
}

// ─── Convite "Usar minha localização" ───────────────────────────────────────

const CHAVE_CONVITE = 'pqf:convite-localizacao'
const DIAS_SEM_INSISTIR = 30

export function conviteDispensado(agora = Date.now()): boolean {
  try {
    const quando = Number(localStorage.getItem(CHAVE_CONVITE))
    return Number.isFinite(quando) && quando > 0 && agora - quando < DIAS_SEM_INSISTIR * 86_400_000
  } catch {
    return false
  }
}

export function dispensarConvite(agora = Date.now()): void {
  try {
    localStorage.setItem(CHAVE_CONVITE, String(agora))
  } catch {
    /* sem armazenamento: o convite volta na próxima visita, sem problema */
  }
}
