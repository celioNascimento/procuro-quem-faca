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
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue ${
        isActive
          ? 'bg-pqf-blue text-white'
          : 'text-slate-600 hover:bg-pqf-blue-soft hover:text-pqf-blue'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {icon}
      </svg>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span
          aria-label={`${badge} pendente${badge > 1 ? 's' : ''}`}
          className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${alerta ? 'bg-red-600 text-white' : 'bg-pqf-yellow text-pqf-ink'}`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
