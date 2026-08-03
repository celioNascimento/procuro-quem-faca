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

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (cancelado) return
      const sessionVal = s ?? null
      setSession(sessionVal)
      setSessionChecked(true)

      if (sessionVal) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionVal))
      } else {
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(AUTH_STATE_KEY)
      }

      if (s?.user?.id) {
        setRoleLoading(true)
        try {
          const [profileReq, prestadorReq] = await Promise.all([
            supabase.from('profiles').select('role').eq('id', s.user.id).maybeSingle(),
            supabase.from('prestadores').select('id, status').eq('user_id', s.user.id).maybeSingle()
          ])
          
          if (!cancelado) {
            const profileRole = profileReq.data?.role
            const prestadorData = prestadorReq.data
            
            const finalRole = profileRole === 'prestador' || prestadorData ? 'prestador' : 'cliente'
            const finalStatus = finalRole === 'prestador' && !prestadorData ? 'pendente' : (prestadorData?.status ?? null)
            
            setRole(finalRole)
            setPrestadorStatus(finalStatus)
            
            // Grava o resultado final no cache para as próximas renderizações
            localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ role: finalRole, prestadorStatus: finalStatus }))
          }
        } catch {
          if (!cancelado) {
            setRole('cliente')
            setPrestadorStatus(null)
            localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ role: 'cliente', prestadorStatus: null }))
          }
        } finally {
          if (!cancelado) setRoleLoading(false)
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelado) return
      const sessionVal = s ?? null
      setSession(sessionVal)
      setSessionChecked(true)

      if (sessionVal) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionVal))
      } else {
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(AUTH_STATE_KEY)
      }

      if (!s) {
        setRole(null)
        setPrestadorStatus(null)
        setRoleLoading(false)
        localStorage.removeItem(AUTH_STATE_KEY)
      }
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