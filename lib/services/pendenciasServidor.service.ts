//lib/services/pendenciasServidor.service.ts
//
// SOMENTE SERVIDOR (service role): usada pelo resumo diário e pelo aviso de denúncia.

import { getAdminClient } from '@/lib/supabase/admin'
import { normalizarPendencias, type Pendencias } from '@/lib/notificacoes/mensagens'

export async function contarPendenciasServidor(): Promise<Pendencias> {
  const { data, error } = await getAdminClient().rpc('contar_pendencias')
  if (error) throw error
  return normalizarPendencias(data)
}
