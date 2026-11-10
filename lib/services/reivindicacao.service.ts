//lib/services/reivindicacao.service.ts

import { supabase } from '@/lib/supabase'

export interface PerfilDoLink {
  id: number
  nome: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function tokenTemFormatoValido(token: string | null | undefined): token is string {
  return !!token && UUID_REGEX.test(token)
}

// Códigos de erro das funções do banco → erros do app
function traduzirErroRpc(error: { code?: string; message?: string }): Error {
  switch (error.code) {
    case 'P0002': return new Error('LINK_INVALIDO')
    case '22023': return new Error('PERFIL_JA_TEM_CONTA')
    case '23505': return new Error('CONTA_JA_TEM_PERFIL')
    case '28000': return new Error('LOGIN_NECESSARIO')
    default: return new Error(error.message || 'ERRO_DESCONHECIDO')
  }
}

// Mostra só o nome do perfil dono do link. Devolve null se o link não vale mais.
export async function consultarPerfilPorToken(token: string): Promise<PerfilDoLink | null> {
  if (!tokenTemFormatoValido(token)) return null
  const { data, error } = await supabase.rpc('consultar_perfil_por_token', { p_token: token })
  if (error) throw traduzirErroRpc(error)
  return (data as PerfilDoLink | null) ?? null
}

// Titular apaga o próprio perfil com o link (não exige login)
export async function excluirPerfilPorToken(token: string): Promise<void> {
  const { error } = await supabase.rpc('excluir_perfil_por_token', { p_token: token })
  if (error) throw traduzirErroRpc(error)
}

// Titular assume o perfil com o link (exige login)
export async function reivindicarPerfilPorToken(token: string): Promise<number> {
  const { data, error } = await supabase.rpc('reivindicar_perfil_por_token', { p_token: token })
  if (error) throw traduzirErroRpc(error)
  return data as number
}
