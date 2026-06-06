import { supabase } from '@/lib/supabase'

export async function logoutCliente(): Promise<void> {
  // 1. Encerra a sessão no Supabase (invalida token no servidor + limpa localStorage nativo do supabase)
  await supabase.auth.signOut()

  // 2. Limpeza manual de resíduos no storage
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k))
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => sessionStorage.removeItem(k))
  }

  // 3. Força reload completo para limpar a memória do React
  window.location.href = '/'
}