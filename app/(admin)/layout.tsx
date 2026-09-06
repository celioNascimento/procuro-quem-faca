// app/(admin)/layout.tsx

'use client'

import '../globals.css'
  import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import '../globals.css'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { userEmail, userName, handleLogout } = useAdminAuth()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isLoginPage = pathname === '/admin/login'
  const mostrarSidebar = !!userEmail && !isLoginPage

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

        <main className={`min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto scroll-smooth ${mostrarSidebar ? 'p-4 md:p-6 lg:p-10' : ''}`}>
          <div className="mx-auto w-full min-w-0 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
