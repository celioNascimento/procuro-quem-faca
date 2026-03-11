'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogIn, User, LayoutDashboard } from 'lucide-react'

// Componente interno — só renderiza no cliente, nunca no servidor
function HeaderBotoes({ onLog }) {
  const [session, setSession]       = useState(undefined) // undefined = ainda carregando
  const [role, setRole]             = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [erroLogin, setErroLogin]   = useState(false)

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

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErroLogin(false)
    onLog?.('CLIQUE_LOGIN_GOOGLE_HERO')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/painel/perfil` }
      })
      if (error) throw error
    } catch {
      setErroLogin(true)
      setTimeout(() => setErroLogin(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const btnGhost   = 'flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap bg-white/80 backdrop-blur-sm border border-slate-200/70 text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow-md hover:bg-white hover:text-slate-700 transition-all duration-200 active:scale-95'
  const btnPrimary = 'flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap bg-blue-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-all duration-200 active:scale-95'
  const skeleton   = 'h-7 md:h-8 rounded-full animate-pulse bg-slate-100'

  // undefined = ainda não resolveu o getSession
  if (session === undefined || roleLoading) {
    return (
      <div className="flex gap-2">
        <div className={`${skeleton} w-24 md:w-32`} />
        <div className={`${skeleton} w-24 md:w-28`} />
      </div>
    )
  }

  if (!session) {
    return (
      <>
        {erroLogin && (
          <span className="text-[9px] font-semibold text-red-400 mr-1 animate-in fade-in">
            Falha. Tente novamente.
          </span>
        )}
        <button onClick={handleGoogleLogin} disabled={loading} className={`${btnGhost} disabled:opacity-40`}>
          {loading
            ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            : <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
          }
          <span className="hidden sm:inline">{loading ? 'Entrando...' : 'Área do cliente'}</span>
        </button>
        <Link href="/login" onClick={() => onLog?.('CLIQUE_SOU_PROFISSIONAL')} className={btnPrimary}>
          <LogIn size={11} />
          <span className="hidden sm:inline">Sou </span>Profissional
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href="/painel/perfil" className={btnGhost}>
        <User size={12} className="text-blue-500 shrink-0" />
        <span className="hidden sm:inline">{role === 'prestador' ? 'Área do Cliente' : 'Minha Área'}</span>
        <span className="sm:hidden">{role === 'prestador' ? 'Cliente' : 'Área'}</span>
      </Link>
      {role === 'prestador' && (
        <Link href="/dashboard" className={btnPrimary}>
          <LayoutDashboard size={12} className="shrink-0" />
          <span className="hidden sm:inline">Meu Painel</span>
          <span className="sm:hidden">Painel</span>
        </Link>
      )}
    </>
  )
}

export default function HeroSection({ onLog }) {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 md:px-5 flex justify-end items-center gap-2 absolute top-0 left-0 right-0 z-50 h-16 md:h-20">
      <HeaderBotoes onLog={onLog} />
    </header>
  )
}