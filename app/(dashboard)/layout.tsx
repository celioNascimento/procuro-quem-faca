//app/(dashboard)/layout.tsx

'use client'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Header href="/dashboard" />

      <main className="mx-auto w-full max-w-7xl px-4 pb-4 pt-16 sm:px-6 sm:pt-28 md:pb-8 md:pt-36 lg:px-8">
        <div className="w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
