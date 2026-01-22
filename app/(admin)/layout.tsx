'use client'

import '../globals.css'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('Administrador')
  const pathname = usePathname()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '') 
        const nomeSugerido = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Administrador'
        setUserName(nomeSugerido)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || '')
        const nomeSugerido = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Administrador'
        setUserName(nomeSugerido)
      } else {
        setUserEmail('')
        setUserName('Administrador')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserEmail('')
    setUserName('Administrador')
    window.location.href = '/admin/login' 
  }

  // Lógica de visibilidade: Logado e NÃO está na página de login
  const isLogged = userEmail !== ''
  const isLoginPage = pathname === '/admin/login'
  const mostrarSidebar = isLogged && !isLoginPage

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* SIDEBAR */}
      {mostrarSidebar && (
        <aside className="w-64 bg-slate-900 min-h-screen flex flex-col p-6 sticky top-0 shadow-2xl z-50">
          <Link href="/admin" className="flex items-center gap-3 mb-12 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-900/20">
              <span className="m-auto">A</span>
            </div>
            <div className="flex flex-col leading-none text-white font-black text-sm uppercase tracking-tighter">
              ProcuroQuemFaça
              <span className="text-blue-400 font-bold text-[8px] uppercase tracking-widest">Londrina</span>
            </div>
          </Link>

          <nav className="flex-1 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Menu Principal</p>
            <SidebarLink href="/admin" icon="📊" label="Dashboard" />
            <SidebarLink href="/admin/geografia" icon="📍" label="Geografia" />
            <SidebarLink href="/admin/habilidades" icon="🛠️" label="Habilidades" />
            {/* Ajustado de /anuncios para /anuncio conforme sua pasta */}
            <SidebarLink href="/admin/anuncios" icon="💰" label="Anúncios" />
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-xs uppercase"
            >
              <span>🚪</span> Sair do Sistema
            </button>
          </div>
        </aside>
      )}

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              {mostrarSidebar ? "Painel Administrativo" : "Sistema de Gestão"}
            </h2>

            {mostrarSidebar && (
              <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                   <p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{userName}</p>
                   <p className="text-[9px] font-bold text-blue-600 lowercase">{userEmail}</p>
                 </div>
                 <div className="w-10 h-10 bg-slate-900 rounded-full border-2 border-white shadow-md flex items-center justify-center font-black text-white text-[12px] uppercase">
                   {userName.charAt(0)}
                 </div>
              </div>
            )}
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs uppercase tracking-tight ${
        isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  )
}