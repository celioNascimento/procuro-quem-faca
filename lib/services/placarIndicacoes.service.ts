// lib/services/placarIndicacoes.service.ts
// Placar de indicações (indicam x não indicam) de vários prestadores de uma vez, para os cards da busca.
import { createPublicClient } from '@/lib/supabase/client'

export interface PlacarDoPrestador {
  indicam: number
  naoIndicam: number
}

// Criado na hora do uso (não ao importar): leitura sem sessão, só contagens.
let cliente: ReturnType<typeof createPublicClient> | null = null
function publico() {
  if (!cliente) cliente = createPublicClient()
  return cliente
}

export async function buscarPlacarDosPrestadores(ids: number[]): Promise<Map<number, PlacarDoPrestador>> {
  const mapa = new Map<number, PlacarDoPrestador>()
  if (ids.length === 0) return mapa
  const { data, error } = await publico().rpc('placar_indicacoes_dos_prestadores', { p_prestador_ids: ids })
  if (error) throw error
  for (const l of (data as { prestador_id: number; indicam: number; nao_indicam: number }[] | null) ?? []) {
    mapa.set(Number(l.prestador_id), { indicam: Number(l.indicam), naoIndicam: Number(l.nao_indicam) })
  }
  return mapa
}
