'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogIn, User, LayoutDashboard } from 'lucide-react'

export default function HeroSection({ onLog }) {
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true)
    onLog('CLIQUE_LOGIN_GOOGLE_HERO')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // CORREÇÃO CIRÚRGICA: Redirecionando diretamente para o perfil do cliente
        redirectTo: `${window.location.origin}/painel/perfil` 
      }
    })
  }

  return (
    <header className={`w-full max-w-5xl px-6 py-6 flex justify-end items-center gap-3 absolute top-0 z-50 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {!session ? (
        <>
          {/* BOTÃO UNIFICADO: GOOGLE + ENTRAR */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                {/* CORREÇÃO DO PATH ABAIXO (LINHA 56) */}
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {loading ? 'Entrando...' : 'Entrar'}
            </span>
          </button>

          {/* BOTÃO PROFISSIONAL */}
          <Link
            href="/login"
            onClick={() => onLog('CLIQUE_SOU_PROFISSIONAL')}
            className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <LogIn size={13} className="opacity-40" />
            Sou Profissional
          </Link>
        </>
      ) : (
        /* --- ESTADO LOGADO --- */
        <>
          <Link
            href="/painel/perfil"
            className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <User size={14} className="text-blue-500" />
            Minha Área
          </Link>

          <Link
            href="/dashboard"
            className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <LayoutDashboard size={14} className="opacity-40" />
            Meu Painel
          </Link>
        </>
      )}
    </header>
  )
}