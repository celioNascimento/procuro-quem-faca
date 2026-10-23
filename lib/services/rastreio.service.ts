// lib/services/rastreio.service.ts
//
// Camada de banco do teste por amostra: lê o modo (amostra | todos) e a lista
// de prestadores da amostra. Recebe o cliente administrativo como parâmetro.
// Se as tabelas não existirem ou a consulta falhar, devolve false (não registra)
// em vez de derrubar a rota: o botão de WhatsApp nunca pode travar por causa disso.

import type { SupabaseClient } from '@supabase/supabase-js'
import { deveRastrear } from '@/lib/tracking/amostra'

export async function rastreioAtivoPara(
  db: SupabaseClient,
  prestadorId: number,
): Promise<boolean> {
  try {
    const [config, amostra] = await Promise.all([
      db.from('rastreio_config').select('valor').eq('chave', 'modo').maybeSingle(),
      db.from('rastreio_amostra').select('prestador_id').eq('prestador_id', prestadorId).maybeSingle(),
    ])

    if (config.error) throw config.error
    if (amostra.error) throw amostra.error

    return deveRastrear(config.data?.valor, amostra.data !== null)
  } catch (error) {
    console.error('[rastreio] Falha ao consultar a amostra; clique não será registrado:', error)
    return false
  }
}
