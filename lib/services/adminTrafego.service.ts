// lib/services/adminTrafego.service.ts — resumo de tráfego para o admin (a regra fica no banco).
import { supabase } from '@/lib/supabase'
import { normalizarResumo, type ResumoTrafego } from '@/lib/admin/trafego'

export async function fetchResumoTrafego(dias = 30): Promise<ResumoTrafego> {
  const { data, error } = await supabase.rpc('admin_trafego_resumo', { p_dias: dias })
  if (error) throw error
  return normalizarResumo(data)
}
