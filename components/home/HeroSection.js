'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LogIn, User, LayoutDashboard } from 'lucide-react'

export default function HeroSection({ onLog }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null) // 'prestador' | 'cliente' | null
  const [loading, setLoading] = useState(false)
  const [erroLogin, setErroLogin] = useState(false)

  useEffect(() => {
    // Sem setTimeout — montagem imediata evita gap de layout
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await detectarRole(data.session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) await detectarRole(session.user.id)
      else setRole(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Detecta se o usuário tem cadastro como prestador.
  // Sem prestador cadastrado → trata como cliente (vai para /painel/perfil).
  const detectarRole = async (userId) => {
    try {
      const { data } = await supabase
        .from('prestadores')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      setRole(data ? 'prestador' : 'cliente')
    } catch {
      setRole('cliente') // fallback seguro
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
      // OAuth redireciona a página — setLoading(false) só alcançado em erro
      setLoading(false)
    }
  }

  return (
    // h-20 garante reserva de espaço desde o primeiro render — sem flash de layout
    <header className="w-full max-w-5xl px-6 py-6 flex justify-end items-center gap-3 absolute top-0 z-50 h-20">

      {!session ? (
        <>
          {/* Erro de login */}
          {erroLogin && (
            <span className="text-[10px] font-bold text-red-500 animate-in fade-in duration-300">
              Falha ao entrar. Tente novamente.
            </span>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group flex items-center gap-2.5 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {loading ? 'Entrando...' : 'Entrar'}
            </span>
          </button>

          <Link
            href="/login"
            onClick={() => onLog?.('CLIQUE_SOU_PROFISSIONAL')}
            className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <LogIn size={13} className="opacity-40" />
            Sou Profissional
          </Link>
        </>
      ) : (
        <>
          {/* Roteamento por role:
              cliente  → /painel/perfil  (área do cliente)
              prestador → /dashboard     (painel do prestador)
              null (carregando) → mostra ambos como fallback seguro */}
          <Link
            href="/painel/perfil"
            className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <User size={14} className="text-blue-500" />
            {role === 'prestador' ? 'Área do Cliente' : 'Minha Área'}
          </Link>

          {/* Só mostra "Meu Painel" para prestadores confirmados ou enquanto carrega role */}
          {role !== 'cliente' && (
            <Link
              href="/dashboard"
              className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              <LayoutDashboard size={14} className="opacity-40" />
              Meu Painel
            </Link>
          )}
        </>
      )}
    </header>
  )
}