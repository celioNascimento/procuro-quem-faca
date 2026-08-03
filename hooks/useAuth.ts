// hooks/useAuth.ts

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client' // Certifique-se de usar o path correto do seu client
import type { Session } from '@supabase/supabase-js'

type Role = 'prestador' | 'cliente' | null

const SESSION_KEY = 'pqf_session_cache'

function getCachedSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    return getCachedSession()
  })
  const [role, setRole] = useState<Role>(null)
  const [prestadorStatus, setPrestadorStatus] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(false)
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
      }

      if (s?.user?.id) {
        setRoleLoading(true)
        try {
          // Busca a intenção (profiles) e o status real (prestadores) em paralelo
          const [profileReq, prestadorReq] = await Promise.all([
            supabase.from('profiles').select('role').eq('id', s.user.id).maybeSingle(),
            supabase.from('prestadores').select('id, status').eq('user_id', s.user.id).maybeSingle()
          ])
          
          if (!cancelado) {
            const profileRole = profileReq.data?.role
            const prestadorData = prestadorReq.data
            
            // O papel final é 'prestador' se a intenção for essa OU se ele já tiver um registro ativo
            const finalRole = profileRole === 'prestador' || prestadorData ? 'prestador' : 'cliente'
            
            setRole(finalRole)
            
            // Se for prestador mas não tiver registro na tabela (cadastro incompleto), força status 'pendente'
            if (finalRole === 'prestador' && !prestadorData) {
              setPrestadorStatus('pendente')
            } else {
              setPrestadorStatus(prestadorData?.status ?? null)
            }
          }
        } catch {
          if (!cancelado) {
            setRole('cliente')
            setPrestadorStatus(null)
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
      }

      if (!s) {
        setRole(null)
        setPrestadorStatus(null)
        setRoleLoading(false)
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