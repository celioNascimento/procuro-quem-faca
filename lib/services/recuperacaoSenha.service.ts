//lib/services/recuperacaoSenha.service.ts

import { supabase } from '@/lib/supabase'
import { insertLog } from '@/lib/db/logs'
import type { Session } from '@supabase/supabase-js'

export async function getSessaoAtual() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function atualizarSenhaUsuario(senha: string) {
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) throw error
}

export async function registrarAcessoNovaSenha(email?: string) {
  await insertLog({
    acao: 'ACESSO_PAGINA_NOVA_SENHA',
    entidadeTipo: 'recuperacao_senha',
    detalhes: { email },
  })
}

export function onAuthStateChangeRecuperacao(
   callback: (event: string, session: Session | null) => void
 ) {
   const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
   return subscription
 }