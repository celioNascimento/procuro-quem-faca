//components/admin/SidebarLink.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

interface SidebarLinkProps {
  href: string
  label: string
  icon: ReactNode
  // Quantidade a tratar; some quando é zero. `alerta` pinta de vermelho (ex.: prazo vencido).
  badge?: number
  alerta?: boolean
}

export function SidebarLink({ href, label, icon, badge = 0, alerta = false }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-all font-semibold text-[11px] uppercase tracking-wider group ${
        isActive
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10'
          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span
          aria-label={`${badge} pendente${badge > 1 ? 's' : ''}`}
          className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold ${alerta ? 'bg-red-500 text-white' : 'bg-amber-400 text-slate-900'}`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}