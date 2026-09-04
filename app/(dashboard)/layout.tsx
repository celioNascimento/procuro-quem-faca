//app/(dashboard)/layout.tsx

'use client'
import Header from '@/components/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24 md:pb-24 md:pt-32 lg:px-8">
        <div className="w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
