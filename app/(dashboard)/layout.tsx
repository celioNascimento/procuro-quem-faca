//app/(dashboard)/layout.tsx

'use client'
import { usePathname } from 'next/navigation'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Na raiz do painel, o destino de segurança é a home (antes apontava para si mesmo).
  const fallback = pathname === '/dashboard' ? '/' : '/dashboard'

  return (
    // overflow-x-clip: nada dentro do painel consegue alargar a página para os lados (no celular isso
    // faz o navegador ampliar/encolher a tela). Diferente de overflow-hidden, não quebra o sticky das abas.
    <div className="min-h-screen overflow-x-clip bg-[#F8FAFC] font-sans antialiased">
      <Header href={fallback} />

      {/* Topo: 96 px no celular (cabeçalho de 64 + 32 de respiro) e 104 px no md+ (72 + 32) — o mesmo da
          área do cliente. Com pt-16 o título ficava colado no cabeçalho. */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-4 pt-24 sm:px-6 md:pb-8 md:pt-26 lg:px-8">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
