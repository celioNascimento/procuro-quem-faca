// hooks/useLogout.ts

import { supabase } from '@/lib/supabase'

export function useLogout() {
  const logout = async (opts?: { origem?: string; redirectTo?: string }) => {
    const origem = opts?.origem ?? 'dashboard'
    const redirectTo = opts?.redirectTo ?? '/'
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        supabase.from('logs_atividades').insert({
          acao: 'LOGOUT_USUARIO',
          usuario_id: session.user.id,
          usuario_email: session.user.email,
          entidade_tipo: 'sessao',
          detalhes: { origem }
        }).then(() => { })
      }
      
      await supabase.auth.signOut()
      
      if (typeof window !== 'undefined') {
        // Limpeza rigorosa de cache conforme documentação
        localStorage.removeItem('pqf_session_cache')
        localStorage.removeItem('pqf_auth_state')
        sessionStorage.clear()
        
        // Inteligência de Roteamento:
        // Se já estiver na página de destino, força o recarregamento.
        // Caso contrário, navega para o destino.
        if (window.location.pathname === redirectTo) {
          window.location.reload()
        } else {
          window.location.href = redirectTo
        }
      }
    } catch (error) {
      console.error('Erro no fluxo de logout:', error)
      // Fallback de segurança absoluto
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }

  return { logout }
}
