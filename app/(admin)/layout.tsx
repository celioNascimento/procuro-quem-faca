// app/(admin)/layout.tsx

'use client'

import '../globals.css'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { userEmail, userName, handleLogout } = useAdminAuth()

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isLoginPage = pathname === '/admin/login'
  const mostrarSidebar = !!userEmail && !isLoginPage

  if (!mounted) return null

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      {mostrarSidebar && (
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      )}

      <div className={`flex-1 flex flex-col min-w-0 h-full ${!mostrarSidebar ? 'items-center justify-center' : ''}`}>
        {mostrarSidebar && (
          <AdminHeader
            userName={userName}
            userEmail={userEmail || ''}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        )}

        <main className={`flex-1 overflow-y-auto scroll-smooth ${mostrarSidebar ? 'p-4 md:p-6 lg:p-10' : ''}`}>
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}