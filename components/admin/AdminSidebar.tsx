//components/admin/AdminSidebar.tsx

'use client'

import Link from 'next/link'
import { SidebarLink } from './SidebarLink'

interface AdminSidebarProps {
  isMobileMenuOpen: boolean
  onCloseMobileMenu: () => void
  onLogout: () => void
}

export function AdminSidebar({ isMobileMenuOpen, onCloseMobileMenu, onLogout }: AdminSidebarProps) {
  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={`
          fixed lg:relative h-full w-72 bg-[#0F172A] flex flex-col shadow-2xl z-[60] transition-transform duration-300 ease-in-out shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
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
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-semibold text-[10px] uppercase tracking-wider group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}