'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        supabase.from('logs_atividades').insert({
          acao: 'LOGOUT_USUARIO',
          usuario_id: session.user.id,
          usuario_email: session.user.email,
          entidade_tipo: 'sessao',
          detalhes: {
            origem: 'dashboard_centralizado',
            plataforma: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
          }
        }).then(() => { })
      }
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Erro crítico no logout:', error)
      window.location.href = '/'
    }
  }

  if (!mounted) {
    return <div className="flex-grow flex flex-col bg-white min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 h-20 md:h-24 flex items-center relative">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-3 items-center h-full relative">
          <div className="flex justify-start items-center"></div>
          <div className="flex justify-center items-center">
            <Link 
              href="/dashboard" 
              className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-transform duration-300 z-10 flex items-center justify-center"
            >
              <img
                src="/logo.png"
                alt="Logo Procuro Quem Faça"
                className="h-40 md:h-52 w-auto object-contain drop-shadow-sm" 
              />
            </Link>
          </div>
          <div className="flex justify-end items-center gap-4">
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-red-50 transition-all active:scale-95"
              title="Encerrar Sessão"
            >
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-red-500 transition-colors italic">
                Sair
              </span>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-red-100 group-hover:text-red-600 transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* CORREÇÃO MÁXIMA: Reduzido o pt para 0, eliminando o espaço entre a barra e o conteúdo */}
      <main className="max-w-7xl mx-auto w-full px-0 pb-24 pt-0">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}