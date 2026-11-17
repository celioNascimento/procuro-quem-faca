// lib/services/selosPublicos.service.ts
// Leitura pública dos selos (anônimos também podem ver): só o que as funções do banco expõem.
// Nunca traz o CNPJ nem a razão social. Falha aqui não pode quebrar a busca nem o perfil.

import { createPublicClient } from '@/lib/supabase/client'
import type { LinhaSeloPublico } from '@/lib/selos/publico'

// Criado na hora do uso (e não ao importar), para não exigir variáveis de ambiente em quem só importa o módulo.
let cliente: ReturnType<typeof createPublicClient> | null = null
function publico() {
  if (!cliente) cliente = createPublicClient()
  return cliente
}

/** Selos aprovados e vigentes de vários prestadores de uma vez (cards da busca). */
export async function buscarSelosPublicos(ids: number[]): Promise<LinhaSeloPublico[]> {
  if (ids.length === 0) return []
  const { data, error } = await publico().rpc('selos_publicos', { p_prestador_ids: ids })
  if (error) throw error
  return (data as LinhaSeloPublico[] | null) ?? []
}

/** Nível calculado pelo banco ('bronze', ...) ou null. */
export async function buscarNivelDoPrestador(id: number): Promise<string | null> {
  const { data, error } = await publico().rpc('nivel_do_prestador', { p_prestador_id: id })
  if (error) throw error
  return typeof data === 'string' ? data : null
}
