// lib/services/adminAtivacao.service.ts

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface PrestadorAtivacao {
  id: number
  nome: string
  whatsapp: string | null
  slug: string
  ativacao_status: string
  ativacao_enviado_em: string | null
  ativacao_obs: string | null
}

export async function listarPrestadoresAtivacao(): Promise<PrestadorAtivacao[]> {
  const { data, error } = await supabase
    .from('prestadores')
    .select('id, nome, whatsapp, slug, ativacao_status, ativacao_enviado_em, ativacao_obs')
    .order('nome')

  if (error) throw error
  return (data ?? []) as PrestadorAtivacao[]
}

export async function atualizarStatusAtivacao(id: number, novoStatus: string) {
  const update: Record<string, unknown> = { ativacao_status: novoStatus }
  if (novoStatus === 'enviado') update.ativacao_enviado_em = new Date().toISOString()
  if (novoStatus === 'respondeu_positivo') update.ativacao_respondeu_em = new Date().toISOString()

  const { error } = await supabase.from('prestadores').update(update).eq('id', id)
  if (error) throw error
  return update
}

export async function salvarObservacaoAtivacao(id: number, obs: string) {
  const { error } = await supabase.from('prestadores').update({ ativacao_obs: obs }).eq('id', id)
  if (error) throw error
}
