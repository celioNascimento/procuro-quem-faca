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
      // Se já carregou a sessão (mesmo que nula), para o loading caso tenha voltado do Google
      setAuthLoading(false) 
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setAuthLoading(false) // Garante que pare o loading ao mudar o estado de auth
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

      // Nota: O código após o signInWithOAuth geralmente não é executado 
      // porque o navegador redireciona. O reset no useEffect cuida do retorno.
      
    } catch (error) {
      console.error('Erro:', error.message)
      setAuthLoading(false)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-100/50 font-sans shadow-sm">
      <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LADO ESQUERDO: VOLTAR */}
        <div className="w-32 flex justify-start">
          {href ? (
            <BackButton href={href} />
          ) : (
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        {/* CENTRO: LOGO */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain" />
          </Link>
        </div>

        {/* LADO DIREITO: LOGIN OU PERFIL */}
        <div className="w-32 flex justify-end">
          {user ? (
            /* USUÁRIO LOGADO: MOSTRA AVATAR */
            <Link 
              href="/painel/perfil"
              className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-100 bg-slate-50 hover:bg-blue-50 transition-all group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-white"><User size={14}/></div>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase text-slate-600 hidden md:block">Conta</span>
            </Link>
          ) : (
            /* USUÁRIO DESLOGADO: MOSTRA BOTÃO ACESSAR */
            <button 
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-100 transition-all active:scale-95 disabled:opacity-70"
            >
              {authLoading ? (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              ) : (
                <LogIn size={16} className="text-slate-400" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {authLoading ? 'Indo...' : 'Acessar'}
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}