//app/(dashboard)/layout.tsx

'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'

// Componente isolado que usa useSearchParams — precisa estar dentro de <Suspense>
function DashboardHeader() {
  const searchParams = useSearchParams()
  const origem = searchParams.get('origem') ?? '/'
  return <Header href={origem} />
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Suspense fallback={<Header href="/" />}>
        <DashboardHeader />
      </Suspense>

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24 md:pb-24 md:pt-32 lg:px-8">
        <div className="w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
