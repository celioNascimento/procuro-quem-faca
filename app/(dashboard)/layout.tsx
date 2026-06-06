'use client'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-8 pb-24">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}