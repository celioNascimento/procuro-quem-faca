'use client'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()

  // Origem capturada pelo HeaderBotoes no momento do clique:
  //   - vindo da busca  → /prestadores?q=...
  //   - vindo do perfil → /celionascimento
  //   - acesso direto   → fallback /
  const origem = searchParams.get('origem') ?? '/'

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Header href={origem} />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-24 md:pt-36 pb-24">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}