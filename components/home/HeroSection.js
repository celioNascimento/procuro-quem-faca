'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { LogIn, User, LayoutDashboard } from 'lucide-react'

export default function HeroSection({ onLog }) {
  const [session, setSession]               = useState(null)
  const [role, setRole]                     = useState(null)
  const [roleLoading, setRoleLoading]       = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [loading, setLoading]               = useState(false)
  const [erroLogin, setErroLogin]           = useState(false)
  const inicializado = useRef(false)

  useEffect(() => {
    // BUG 3: usar APENAS onAuthStateChange como fonte de verdade.
    // O listener recebe INITIAL_SESSION na montagem — getSession() é redundante
    // e cria race condition. Removido getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (session) {
        if (!inicializado.current) setRoleLoading(true)
        await detectarRole(session.user.id)
      } else {
        setRole(null)
        setRoleLoading(false)
      }

      // Só libera o sessionLoading na primeira vez (INITIAL_SESSION)
      // Eventos subsequentes (TOKEN_REFRESHED ao voltar de aba) não resetam o UI
      if (!inicializado.current) {
        setSessionLoading(false)
        inicializado.current = true
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const detectarRole = async (userId) => {
    try {
      const { data } = await supabase
        .from('prestadores').select('id').eq('user_id', userId).maybeSingle()
      setRole(data ? 'prestador' : 'cliente')
    } catch {
      setRole('cliente')
    } finally {
      setRoleLoading(false)
    }
  }

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

  // BUG 5: strings diretas em vez de array.join() — Tailwind faz purge correto
  const btnGhost = 'flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap bg-white/80 backdrop-blur-sm border border-slate-200/70 text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow-md hover:bg-white hover:text-slate-700 transition-all duration-200 active:scale-95'
  const btnPrimary = 'flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap bg-blue-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-all duration-200 active:scale-95'
  const skeleton = 'h-7 md:h-8 rounded-full animate-pulse bg-slate-100'

  return (
    <header className="w-full max-w-5xl mx-auto px-4 md:px-5 flex justify-end items-center gap-2 absolute top-0 left-0 right-0 z-50 h-16 md:h-20">

      {sessionLoading ? (
        <div className="flex gap-2">
          <div className={`${skeleton} w-24 md:w-32`} />
          <div className={`${skeleton} w-24 md:w-28`} />
        </div>

      ) : !session ? (
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

      ) : roleLoading ? (
        <div className="flex gap-2">
          <div className={`${skeleton} w-24 md:w-32`} />
          <div className={`${skeleton} w-20 md:w-28`} />
        </div>

      ) : (
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
      )}
    </header>
  )
}