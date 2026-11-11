//lib/services/bloqueio.service.ts
//
// O motivo do bloqueio fica em `prestador_bloqueio`: só o administrador e o próprio prestador leem.

import { supabase } from '@/lib/supabase'

export async function buscarMotivoBloqueio(prestadorId: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('prestador_bloqueio')
    .select('motivo')
    .eq('prestador_id', prestadorId)
    .maybeSingle()
  if (error) throw error
  return data?.motivo ?? null
}
