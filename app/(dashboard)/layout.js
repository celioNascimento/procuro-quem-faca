'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Garante a hidratação correta para evitar erros de SSR
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      // 1. Tenta capturar a sessão para o log antes de encerrá-la
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Registro de log (Fire and forget para não travar o fluxo)
        supabase.from('logs_atividades').insert({
          acao: 'LOGOUT_USUARIO',
          usuario_id: session.user.id,
          usuario_email: session.user.email,
          entidade_tipo: 'sessao',
          detalhes: { 
            origem: 'dashboard_centralizado',
            plataforma: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
          }
        }).then(() => {})
      }

      // 2. Encerra a sessão no Supabase (Cookies gerenciados pelo @supabase/ssr)
      await supabase.auth.signOut()
      
      // 3. Limpeza de cache local
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // 4. Redirecionamento e atualização de rotas
      router.push('/')
      router.refresh()
      
    } catch (error) {
      console.error('Erro crítico no logout:', error)
      // Fallback supremo: força o redirecionamento pelo navegador
      window.location.href = '/'
    }
  }

  // Proteção contra Hydration Mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-white" /> 
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Header / Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 h-16 flex items-center">
        <div className="max-w-2xl mx-auto w-full px-6 flex justify-between items-center">
          
          {/* Logo Procuro que Faça - Agora direcionando para a Home */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/logo.png" 
              alt="Logo Procuro que Faça" 
              className="h-9 w-auto object-contain"
            />
          </Link>

          <div className="flex gap-4 items-center">
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-red-50 transition-all active:scale-95"
              title="Encerrar Sessão"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-red-500 transition-colors italic">
                Sair
              </span>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-red-100 group-hover:text-red-600 transition-all shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Área de Conteúdo */}
      <main className="max-w-7xl mx-auto w-full px-0 pb-24">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      {/* Dock Inferior Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-lg px-6 py-3 rounded-full border border-white/10 shadow-2xl z-50 flex items-center gap-10">
          <Link href="/dashboard" className="text-white text-xl hover:scale-110 transition-transform">🏠</Link>
          <div className="w-px h-4 bg-white/20" />
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="text-white text-xl hover:scale-110 transition-transform"
          >
            🚀
          </button>
      </div>
    </div>
  )
}