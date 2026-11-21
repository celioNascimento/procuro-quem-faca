// lib/services/adminEquipe.service.ts
// Só funções do banco que exigem administrador (adicionar e remover exigem o dono).

import { supabase } from '@/lib/supabase'
import { normalizarEquipe, type EquipeAdmin } from '@/lib/admin/equipe'

export async function carregarEquipe(): Promise<EquipeAdmin> {
  const { data, error } = await supabase.rpc('admin_equipe')
  if (error) throw error
  return normalizarEquipe(data)
}

export interface ResultadoAdicionar {
  codigo: string
  convidado: boolean
  /** Mensagem pronta quando a rota recusou (sem permissão, limite de e-mails, erro). */
  mensagem?: string
}

/**
 * Adiciona à equipe pela rota de API (que manda o convite por e-mail quando a pessoa ainda não tem conta).
 * Códigos do banco: 'ok', 'sem_permissao', 'ja_e_admin', 'email_invalido'...
 */
export async function adicionarAdmin(email: string): Promise<ResultadoAdicionar> {
  const res = await fetch('/api/admin/equipe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const corpo = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { codigo: 'falha', convidado: false, mensagem: typeof corpo?.error === 'string' ? corpo.error : undefined }
  }
  return { codigo: String(corpo.codigo ?? 'falha'), convidado: corpo.convidado === true }
}

export async function removerAdmin(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_equipe_remover', { p_user_id: userId })
  if (error) throw error
  return String(data)
}
