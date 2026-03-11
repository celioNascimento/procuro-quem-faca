'use client'

import '../globals.css'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState('Administrador')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false) // Trava mestra para Hydration
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // 1. Garantia de Montagem no Cliente
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setIsMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // 2. Lógica de Autenticação
  useEffect(() => {
    if (!mounted) return

    const checkUser = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || '')
        const nomeSugerido = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'
        setUserName(nomeSugerido)
      } else if (pathname !== '/admin/login') {
        router.push('/admin/login')
      }
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || '')
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin')
      } else {
        setUserEmail(null)
        if (pathname !== '/admin/login') router.push('/admin/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, mounted])

  // 3. Fechar menu mobile ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const isLoginPage = pathname === '/admin/login'
  const mostrarSidebar = userEmail && !isLoginPage

  if (!mounted) return null

  if (loading && !isLoginPage) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validando Acesso...</p>
        </div>
      </div>
    )
  }

  if (!userEmail && !isLoginPage) return null

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">

      {/* Overlay Mobile */}
      {isMobileMenuOpen && mostrarSidebar && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {mostrarSidebar && (
        <aside className={`
          fixed lg:relative h-full w-72 bg-[#0F172A] flex flex-col shadow-2xl z-[60] transition-transform duration-300 ease-in-out shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-8 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="flex flex-col text-white">
                <span className="font-bold text-sm uppercase tracking-tight leading-tight">ProcuroQuemFaça</span>
                <span className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider">Console Admin</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-4 mt-2">Gestão Geral</p>
            <SidebarLink href="/admin" label="Dashboard" icon={<path d="M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zm-11 11h7v-7H3v7z" />} />
            <SidebarLink href="/admin/moderacao" label="Moderação" icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />} />
            
            {/* Inclusão Cirúrgica do Link de Ativação */}
            <SidebarLink
              href="/admin/ativacao"
              label="Ativação"
              icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />}
            />

            <SidebarLink href="/admin/povoar" label="Povoar Base" icon={<path d="M12 4v16m8-8H4" />} />
            <SidebarLink href="/admin/anuncios" label="Anúncios" icon={<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />

            <div className="pt-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-4">Inteligência</p>
              <SidebarLink href="/admin/logs" label="Logs & Analytics" icon={<><path d="M18 20V10M12 20V4M6 20v-6" /></>} />
            </div>

            <div className="pt-6 pb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-4">Configurações</p>
              <SidebarLink href="/admin/geografia" label="Geografia" icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>} />
              <SidebarLink href="/admin/habilidades" label="Habilidades" icon={<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />} />
            </div>
          </nav>

          <div className="p-4 border-t border-slate-800/50">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-semibold text-[10px] uppercase tracking-wider group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair da conta
            </button>
          </div>
        </aside>
      )}

      <div className={`flex-1 flex flex-col min-w-0 h-full ${!mostrarSidebar ? 'items-center justify-center' : ''}`}>
        {mostrarSidebar && (
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 bg-slate-100 rounded-xl"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5H17M3 10H17M3 15H17" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="hidden sm:block">
                <h2 className="text-sm font-bold text-slate-800 leading-tight tracking-tight uppercase">Admin Console</h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Londrina - PR</p>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-none mb-1 capitalize tracking-tight">{userName}</p>
                <p className="text-[10px] font-semibold text-blue-600/70 lowercase">{userEmail}</p>
              </div>
              <div className="w-10 h-10 lg:w-11 lg:h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-700 text-sm border border-white shadow-sm relative">
                {userName.charAt(0)}
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto scroll-smooth ${mostrarSidebar ? 'p-4 md:p-6 lg:p-10' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-semibold text-[11px] uppercase tracking-wider group ${isActive
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
        }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </Link>
  )
}