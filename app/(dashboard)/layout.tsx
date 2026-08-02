'use client'
import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'

// Componente isolado que usa useSearchParams
function DashboardHeader() {
  const searchParams = useSearchParams()
  const origem = searchParams.get('origem') ?? '/'
  return <Header href={origem} />
}

// Gatekeeper: Bloqueia renderização e redireciona se pendente
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, sessionChecked, role, prestadorStatus } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (sessionChecked && session && role === 'prestador' && prestadorStatus === 'pendente') {
      router.replace('/cadastro')
    }
  }, [session, sessionChecked, role, prestadorStatus, router])

  // Aguarda a verificação da sessão para evitar piscar o layout do dashboard
  if (!sessionChecked) return null

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Suspense fallback={<Header href="/" />}>
        <DashboardHeader />
      </Suspense>

      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-24 md:pt-36 pb-24">
        <RouteGuard>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
            {children}
          </div>
        </RouteGuard>
      </main>
    </div>
  )
}