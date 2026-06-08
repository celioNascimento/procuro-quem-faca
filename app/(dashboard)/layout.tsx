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

      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-24 md:pt-36 pb-24">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}