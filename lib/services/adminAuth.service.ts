//lib/services/adminAuth.service.ts

import { supabase } from '@/lib/supabase'
import {
  MSG_CREDENCIAIS_INVALIDAS,
  MSG_FALHA_AO_ENTRAR,
  MSG_FALHA_AO_ENVIAR_LINK,
  MSG_SEM_ACESSO_AO_PAINEL,
} from '@/lib/auth/adminLogin'

/**
 * Entra com e-mail e senha e confere se a conta é de administrador (`perfis_admin`).
 * Devolve a mensagem de erro em linguagem simples, ou null quando deu certo.
 * Conta que não é admin é desconectada na hora (não fica com sessão aberta no site).
 */
export async function loginAdmin(email: string, password: string): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error || !data?.user) return MSG_CREDENCIAIS_INVALIDAS

  const { data: perfilAdmin, error: erroPerfil } = await supabase
    .from('perfis_admin')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (erroPerfil) {
    await supabase.auth.signOut()
    return MSG_FALHA_AO_ENTRAR
  }
  if (!perfilAdmin) {
    await supabase.auth.signOut()
    return MSG_SEM_ACESSO_AO_PAINEL
  }
  return null
}

/**
 * Pede o link de nova senha. O Supabase responde igual para e-mail cadastrado ou não, então a tela
 * nunca revela se existe conta. Usa a mesma página de recuperação do site (/recuperar-senha).
 * Devolve a mensagem de erro, ou null quando o pedido foi aceito.
 */
export async function enviarLinkDeNovaSenha(email: string, origem: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origem}/recuperar-senha`,
  })
  return error ? MSG_FALHA_AO_ENVIAR_LINK : null
}

/** Encerra a sessão (usado quando a pessoa desiste na etapa do código). */
export async function sairDaConta(): Promise<void> {
  await supabase.auth.signOut()
}
