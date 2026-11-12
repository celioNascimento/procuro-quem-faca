'use client'

import Link from 'next/link'
import { SidebarLink } from './SidebarLink'
import { useAdminPendencias } from '@/hooks/admin/useAdminPendencias'
import { totalModeracao } from '@/lib/notificacoes/mensagens'
import Logo from '@/components/Logo'

interface AdminSidebarProps {
  isMobileMenuOpen: boolean
  onCloseMobileMenu: () => void
  onLogout: () => void
}

const SECAO = 'px-4 pb-2 pt-6 text-xs font-semibold text-pqf-muted'

export function AdminSidebar({ isMobileMenuOpen, onCloseMobileMenu, onLogout }: AdminSidebarProps) {
  const pendencias = useAdminPendencias()

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-pqf-ink/50 z-[55] lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={`
          fixed lg:relative h-full w-72 bg-white border-r border-slate-200 flex flex-col z-[60] transition-transform duration-300 ease-in-out shrink-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="px-6 pt-6 pb-2">
          <Link href="/admin" aria-label="Painel administrativo" className="inline-block">
            <Logo variant="nav" />
          </Link>
          <p className="mt-3 text-xs font-semibold text-pqf-muted">Console administrativo</p>
        </div>

        <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
          <p className={SECAO}>Gestão geral</p>
          <SidebarLink href="/admin" label="Visão geral" icon={<path d="M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zm-11 11h7v-7H3v7z" />} />
          <SidebarLink href="/admin/moderacao" label="Moderação" badge={pendencias ? totalModeracao(pendencias) : 0} icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />} />
          <SidebarLink
            href="/admin/titular"
            label="Pedidos LGPD"
            badge={pendencias?.titular_abertas ?? 0}
            alerta={(pendencias?.titular_atrasadas ?? 0) > 0}
            icon={<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>}
          />
          <SidebarLink
            href="/admin/ativacao"
            label="Ativação"
            icon={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />}
          />
          <SidebarLink href="/admin/prestadores" label="Prestadores" icon={<><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a6 6 0 0 0-4-5.65" /></>} />
          <SidebarLink href="/admin/povoar" label="Povoar base" icon={<path d="M12 4v16m8-8H4" />} />
          <SidebarLink href="/admin/anuncios" label="Anúncios" icon={<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />} />

          <p className={SECAO}>Inteligência</p>
          <SidebarLink href="/admin/logs" label="Logs e analytics" icon={<><path d="M18 20V10M12 20V4M6 20v-6" /></>} />
          <SidebarLink href="/admin/cliques" label="Cliques no WhatsApp" icon={<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />} />

          <p className={SECAO}>Configurações</p>
          <SidebarLink href="/admin/geografia" label="Geografia" icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>} />
          <SidebarLink href="/admin/habilidades" label="Habilidades" icon={<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />} />
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}
