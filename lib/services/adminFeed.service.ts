// lib/services/adminFeed.service.ts
// Acesso ao banco da tela Feed do admin. Só funções do banco que exigem administrador.

import { supabase } from '@/lib/supabase'
import { normalizarResumoFeed, type ResumoFeedAdmin } from '@/lib/feed/adminFeed'

export async function carregarResumoFeed(dias = 14): Promise<ResumoFeedAdmin> {
  const { data, error } = await supabase.rpc('admin_feed_resumo', { p_dias: dias })
  if (error) throw error
  return normalizarResumoFeed(data)
}

/** Devolve o código da função do banco ('ok', 'motivo_obrigatorio', ...). */
export async function removerDoFeed(projetoId: string, motivo: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_remover_do_feed', { p_projeto_id: projetoId, p_motivo: motivo })
  if (error) throw error
  return String(data)
}

export async function devolverAoFeed(projetoId: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_devolver_ao_feed', { p_projeto_id: projetoId })
  if (error) throw error
  return String(data)
}
