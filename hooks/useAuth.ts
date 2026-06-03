import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

type Role = 'prestador' | 'cliente' | null

export function useAuth() {
  const [session,     setSession]     = useState<Session | null | undefined>(undefined)
  const [role,        setRole]        = useState<Role>(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [erroLogin,   setErroLogin]   = useState(false)

  useEffect(() => {
    let cancelado = false

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelado) return
      setSession(s ?? null)
      if (s?.user?.id) {
        setRoleLoading(true)
        try {
          const { data } = await supabase
            .from('prestadores').select('id').eq('user_id', s.user.id).maybeSingle()
          if (!cancelado) setRole(data ? 'prestador' : 'cliente')
        } catch {
          if (!cancelado) setRole('cliente')
        } finally {
          if (!cancelado) setRoleLoading(false)
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelado || event === 'INITIAL_SESSION') return
      setSession(s ?? null)
      if (!s) { setRole(null); setRoleLoading(false) }
    })

    return () => { cancelado = true; subscription.unsubscribe() }
  }, [])

  async function loginGoogle(onLog?: (acao: string) => void) {
    setLoading(true)
    setErroLogin(false)
    onLog?.('CLIQUE_LOGIN_GOOGLE_HERO')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/painel/perfil` },
      })
      if (error) throw error
    } catch {
      setErroLogin(true)
      setTimeout(() => setErroLogin(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return { session, role, roleLoading, loading, erroLogin, loginGoogle }
}