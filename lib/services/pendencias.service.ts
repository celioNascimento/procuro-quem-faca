//lib/services/pendencias.service.ts
//
// Contador de pendências do painel admin (roda no navegador, com a sessão do administrador).

import { supabase } from '@/lib/supabase'
import { normalizarPendencias, type Pendencias } from '@/lib/notificacoes/mensagens'

export async function buscarPendencias(): Promise<Pendencias> {
  const { data, error } = await supabase.rpc('admin_pendencias')
  if (error) throw error
  return normalizarPendencias(data)
}
