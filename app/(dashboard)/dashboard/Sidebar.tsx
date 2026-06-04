'use client'
import Link from 'next/link'
import { useLogout } from '@/hooks/useLogout'
import { usePathname } from 'next/navigation'

export default function Sidebar() {

  const pathname = usePathname()
  const { logout } = useLogout()

  const menuItems = [
    { label: 'Visão Geral', href: '/dashboard', icon: '📊' },
    { label: 'Meu Perfil', href: '/dashboard/perfil', icon: '👤' },
    { label: 'Portfólio', href: '/dashboard/portfolio', icon: '📷' },
    // Adicione mais itens conforme necessário
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">P</div>
        <span className="font-bold text-slate-800 tracking-tight">Povoar.DB</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-bold ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="..."
        >
          Sair da Conta
        </button>
      </div>
    </aside>
  )
}
