//app/(dashboard)/layout.tsx

'use client'
import { usePathname } from 'next/navigation'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Na raiz do painel, o destino de segurança é a home (antes apontava para si mesmo).
  const fallback = pathname === '/dashboard' ? '/' : '/dashboard'

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Header href={fallback} />

      {/* Mesmo recuo do topo da área do cliente (app/painel/perfil): o título fica à mesma distância do cabeçalho. */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-4 pt-24 sm:px-6 md:pb-8 md:pt-26 lg:px-8">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
