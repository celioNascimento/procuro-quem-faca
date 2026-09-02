import { supabase } from '@/lib/supabase'
import type { PrestadorFormData } from '@/types/prestador'

type PrestadorRow = PrestadorFormData & { user_id: string | null }

export async function getSessaoAtual() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function buscarPrestadorPorUserId(userId: string) {
  const { data, error } = await supabase
    .from('prestadores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as PrestadorRow | null
}

export async function buscarPrestadorPorId(id: string) {
  const { data, error } = await supabase
    .from('prestadores')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as PrestadorRow | null
}

export async function deletarPrestador(id: string | number) {
  const { error } = await supabase.from('prestadores').delete().eq('id', id)
  if (error) throw error
}

export async function deletarOutrosPrestadoresDoUsuario(userId: string, exceptId: string | number) {
  const { error } = await supabase
    .from('prestadores')
    .delete()
    .eq('user_id', userId)
    .neq('id', exceptId)
  if (error) throw error
}

export async function upsertPrestador(payload: Record<string, unknown>) {
  const { error } = await supabase.from('prestadores').upsert(payload)
  if (error) throw error
}

export async function criarContaEmail(email: string, senha: string, nome: string) {
  const redirectTo = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`
    : undefined

  return supabase.auth.signUp({
    email,
    password: senha,
    options: {
      emailRedirectTo: redirectTo,
      data: { nome },
    },
  })
}

export async function loginEmail(email: string, senha: string) {
  return supabase.auth.signInWithPassword({ email, password: senha })
}

export async function atualizarSenha(senha: string) {
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) throw error
}

/**
   * Verifica se um slug está disponível, excluindo o próprio registro
   * (idAtual) da checagem — usado no fluxo de edição, onde o prestador
   * mantém o próprio slug sem ser bloqueado por si mesmo.
   */
export async function verificarSlugDisponivel(slug: string, idAtual?: number | string | null): Promise<boolean> {
  const { data, error } = await supabase
    .from('prestadores')
    .select('id')
    .eq('slug', slug)
    .neq('id', idAtual ?? -1)
    .maybeSingle()
  if (error) throw error
  return !data
}
