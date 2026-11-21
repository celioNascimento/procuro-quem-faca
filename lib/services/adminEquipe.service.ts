// lib/services/adminEquipe.service.ts
// Só funções do banco que exigem administrador (adicionar e remover exigem o dono).

import { supabase } from '@/lib/supabase'
import { normalizarEquipe, type EquipeAdmin } from '@/lib/admin/equipe'

export async function carregarEquipe(): Promise<EquipeAdmin> {
  const { data, error } = await supabase.rpc('admin_equipe')
  if (error) throw error
  return normalizarEquipe(data)
}

/** Devolve o código do banco ('ok', 'sem_conta', 'ja_e_admin', ...). */
export async function adicionarAdmin(email: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_equipe_adicionar', { p_email: email })
  if (error) throw error
  return String(data)
}

export async function removerAdmin(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_equipe_remover', { p_user_id: userId })
  if (error) throw error
  return String(data)
}
