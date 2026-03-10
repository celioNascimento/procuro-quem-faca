'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogIn, User, LayoutDashboard } from 'lucide-react'

export default function HeroSection({ onLog }) {
  const [session, setSession]           = useState(null)
  const [role, setRole]                 = useState(null)
  const [roleLoading, setRoleLoading]   = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true) // true até saber se há sessão
  const [loading, setLoading]           = useState(false)
  const [erroLogin, setErroLogin]       = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) {
        setRoleLoading(true)
        await detectarRole(data.session.user.id)
      }
      setSessionLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        setRoleLoading(true)
        await detectarRole(session.user.id)
      } else {
        setRole(null)
        setRoleLoading(false)
      }
      setSessionLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const detectarRole = async (userId) => {
    try {
      const { data } = await supabase
        .from('prestadores')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
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

  // Estilos consistentes
  const btnGhost   = 'flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:border-slate-300 transition-all shadow-sm active:scale-95'
  const btnPrimary = 'flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95'
  const btnSkeleton = 'h-8 rounded-full bg-slate-100/80 animate-pulse'

  return (
    <header className="w-full max-w-5xl mx-auto px-5 py-5 flex justify-end items-center gap-2.5 absolute top-0 left-0 right-0 z-50 h-20">

      {/* Enquanto não sabemos se há sessão — skeletons evitam flash */}
      {sessionLoading ? (
        <div className="flex gap-2.5">
          <div className={`${btnSkeleton} w-28`} />
          <div className={`${btnSkeleton} w-28`} />
        </div>

      ) : !session ? (
        <>
          {erroLogin && (
            <span className="text-[10px] font-bold text-red-500 animate-in fade-in duration-300 mr-1">
              Falha ao entrar. Tente novamente.
            </span>
          )}

          {/* Entrar com Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`${btnGhost} disabled:opacity-50`}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{loading ? 'Entrando...' : 'Área do cliente'}</span>
          </button>

          {/* Sou Profissional — CTA primário */}
          <Link
            href="/login"
            onClick={() => onLog?.('CLIQUE_SOU_PROFISSIONAL')}
            className={btnPrimary}
          >
            <LogIn size={12} />
            Sou Profissional
          </Link>
        </>

      ) : roleLoading ? (
        /* Logado mas carregando role — skeleton evita flash do "Meu Painel" */
        <div className="flex gap-2.5">
          <div className={`${btnSkeleton} w-32`} />
          <div className={`${btnSkeleton} w-28`} />
        </div>

      ) : (
        <>
          <Link href="/painel/perfil" className={btnGhost}>
            <User size={13} className="text-blue-500" />
            {role === 'prestador' ? 'Área do Cliente' : 'Minha Área'}
          </Link>

          {/* role === 'prestador' explícito — nunca aparece para clientes ou durante loading */}
          {role === 'prestador' && (
            <Link href="/dashboard" className={btnPrimary}>
              <LayoutDashboard size={13} />
              Meu Painel
            </Link>
          )}
        </>
      )}
    </header>
  )
}