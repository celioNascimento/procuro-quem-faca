//components/admin/SidebarLink.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

interface SidebarLinkProps {
  href: string
  label: string
  icon: ReactNode
}

export function SidebarLink({ href, label, icon }: SidebarLinkProps) {
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
      {label}
    </Link>
  )
}