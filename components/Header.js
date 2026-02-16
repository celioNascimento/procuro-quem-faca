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
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-100/80 font-sans shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        
        {/* LADO ESQUERDO: VOLTAR (Reduzido para h-8/w-8 no mobile para não brigar com a logo) */}
        <div className="w-16 md:w-32 flex justify-start">
          {href ? (
            <BackButton href={href} />
          ) : (
            <button 
              onClick={() => router.back()}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-50 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        {/* CENTRO: LOGO */}
        <div className="flex-1 flex justify-center px-2">
          <Link href="/" className="transition-opacity hover:opacity-80 flex items-center">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-9 md:h-14 w-auto object-contain max-w-[130px] md:max-w-none" 
            />
          </Link>
        </div>

        {/* LADO DIREITO: LOGIN OU PERFIL */}
        <div className="w-16 md:w-32 flex justify-end">
          {user ? (
            <Link 
              href="/painel/perfil"
              className="flex items-center gap-2 p-1 md:pr-3 rounded-full border border-slate-100 bg-slate-50 hover:bg-blue-50 transition-all group"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-white shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-white"><User size={12}/></div>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 hidden md:block">Conta</span>
            </Link>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="flex items-center gap-2 p-2 md:px-4 md:py-2.5 rounded-lg md:rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-70"
            >
              {authLoading ? (
                <Loader2 size={14} className="animate-spin text-blue-600" />
              ) : (
                <LogIn size={14} className="text-blue-600 md:text-slate-400" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 hidden sm:block">
                {authLoading ? '...' : 'Entrar'}
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}