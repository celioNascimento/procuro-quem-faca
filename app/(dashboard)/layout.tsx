//app/(dashboard)/layout.tsx

'use client'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Header href="/dashboard" />

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20 md:pb-16 md:pt-24 lg:px-8">
        <div className="w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
