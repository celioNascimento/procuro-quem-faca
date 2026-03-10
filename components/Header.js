'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BackButton from './BackButton'
import { User, Loader2, LogIn } from 'lucide-react'

export default function Header({ href }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setAuthLoading(false) 
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/painel/perfil`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Erro:', error.message)
      setAuthLoading(false)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md font-sans border-b border-slate-50">
      <div className="max-w-5xl mx-auto px-4 h-20 md:h-28 flex items-center justify-between">
        
        {/* LADO ESQUERDO */}
        <div className="w-12 md:w-32 flex justify-start items-center shrink-0">
          {href ? (
            <BackButton href={href} />
          ) : (
            <button 
              onClick={() => router.back()}
              className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        {/* CENTRO: LOGO - Proteção contra encolhimento */}
        {/* Adicionado w-full para garantir que o container ocupe o centro */}
        <div className="flex-1 flex justify-center px-2 w-full">
          {/* Adicionado um controle rígido de largura (w-40 mobile, w-64 desktop) para impedir o esmagamento */}
          <Link href="/" className="transition-all hover:opacity-80 active:scale-95 flex items-center justify-center w-40 md:w-64">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-auto object-contain" 
            />
          </Link>
        </div>

        {/* LADO DIREITO */}
        <div className="w-12 md:w-32 flex justify-end items-center shrink-0">
          {user ? (
            <Link 
              href="/painel/perfil"
              className="flex items-center gap-2 p-1 md:pr-4 rounded-full border border-slate-100 bg-slate-50 hover:bg-blue-50 transition-all group"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-white"><User size={14}/></div>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 hidden md:block">Minha Conta</span>
            </Link>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="flex items-center justify-center md:gap-2 w-9 h-9 md:w-auto md:px-5 md:py-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-95 disabled:opacity-70"
            >
              {authLoading ? (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              ) : (
                <LogIn size={16} className="text-blue-600 md:text-slate-400" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hidden md:block">
                {authLoading ? '...' : 'Entrar'}
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
