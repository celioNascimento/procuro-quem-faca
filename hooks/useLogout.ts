// hooks/useLogout.ts
import { supabase } from '@/lib/supabase'

export function useLogout() {
  const logout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        supabase.from('logs_atividades').insert({
          acao: 'LOGOUT_USUARIO',
          usuario_id: session.user.id,
          usuario_email: session.user.email,
          entidade_tipo: 'sessao',
          detalhes: { origem: 'dashboard' }
        }).then(() => { })
      }
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pqf_session_cache')
        sessionStorage.clear()
      }
    } catch { }
    window.location.href = '/'
  }

  return { logout }
}