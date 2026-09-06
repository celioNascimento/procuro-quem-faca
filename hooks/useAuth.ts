//hooks/useAuth.ts

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

type Role = 'prestador' | 'cliente' | null

const SESSION_KEY = 'pqf_session_cache'
const AUTH_STATE_KEY = 'pqf_auth_state' // Novo cache para estado do perfil

function getCachedSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(AUTH_STATE_KEY) // Limpa o estado junto
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function getCachedAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_STATE_KEY)
    return raw ? JSON.parse(raw) : { role: null, prestadorStatus: null }
  } catch {
    return { role: null, prestadorStatus: null }
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    return getCachedSession()
  })
  
  // Agora inicializa o estado lendo direto do cache para evitar FOUC
  const [role, setRole] = useState<Role>(() => {
    if (typeof window === 'undefined') return null
    return getCachedAuthState().role
  })
  
  const [prestadorStatus, setPrestadorStatus] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return getCachedAuthState().prestadorStatus
  })
  
  const [roleLoading, setRoleLoading] = useState(() => {
    if (typeof window === 'undefined') return false
    return getCachedSession() !== null
  })
  const [loading, setLoading] = useState(false)
  const [erroLogin, setErroLogin] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    let cancelado = false

    const limparAuthState = () => {
      setRole(null)
      setPrestadorStatus(null)
      setRoleLoading(false)
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(AUTH_STATE_KEY)
    }

    const resolverAuthState = async (s: Session | null) => {
      if (cancelado) return
      setRoleLoading(Boolean(s?.user?.id))

      if (!s?.user?.id) {
        limparAuthState()
        return
      }

      try {
        const [profileReq, prestadorReq] = await Promise.all([
          supabase.from('profiles').select('role').eq('id', s.user.id).maybeSingle(),
          supabase.from('prestadores').select('id, status').eq('user_id', s.user.id).maybeSingle(),
        ])
        if (cancelado) return

        const prestadorData = prestadorReq.data
        const finalRole: Role = profileReq.data?.role === 'prestador' || prestadorData ? 'prestador' : 'cliente'
        const finalStatus = finalRole === 'prestador' && !prestadorData ? 'pendente' : (prestadorData?.status ?? null)
        setRole(finalRole)
        setPrestadorStatus(finalStatus)
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ role: finalRole, prestadorStatus: finalStatus }))
      } catch {
        if (cancelado) return
        setRole('cliente')
        setPrestadorStatus(null)
        localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ role: 'cliente', prestadorStatus: null }))
      } finally {
        if (!cancelado) setRoleLoading(false)
      }
    }

    const aplicarSessao = (s: Session | null) => {
      if (cancelado) return
      setSession(s)
      setSessionChecked(true)
      if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      void resolverAuthState(s)
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => aplicarSessao(s ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      aplicarSessao(s ?? null)
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
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/painel/perfil` },
      })
      if (error) throw error
    } catch {
      setErroLogin(true)
      setTimeout(() => setErroLogin(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return { session, role, prestadorStatus, roleLoading, loading, erroLogin, loginGoogle, sessionChecked } 
}
