// lib/services/anunciosMetricas.service.ts
// Responsabilidade única: persistência de métricas de anúncios.
// Usa service_role para ter permissão de chamar a RPC incrementar_metrica_anuncio.
// Nunca importar no bundle client — apenas em API routes e Server Actions.

import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export type TipoMetrica = 'impressao' | 'clique'

export async function incrementarMetricaAnuncio(
  anuncioId: string,
  segmentacaoId: string,
  tipo: TipoMetrica
): Promise<void> {
  const supabase = createServiceClient()
  const hoje = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

  const { error } = await supabase.rpc('incrementar_metrica_anuncio', {
    p_anuncio_id: anuncioId,
    p_segmentacao_id: segmentacaoId,
    p_data_referencia: hoje,
    p_impressoes: tipo === 'impressao' ? 1 : 0,
    p_cliques: tipo === 'clique' ? 1 : 0,
  })

  if (error) throw error
}
