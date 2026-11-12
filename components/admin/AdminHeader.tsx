'use client'

interface AdminHeaderProps {
  userName: string
  userEmail: string
  onOpenMobileMenu: () => void
}

export function AdminHeader({ userName, userEmail, onOpenMobileMenu }: AdminHeaderProps) {
  const inicial = (userName || userEmail || '?').charAt(0).toUpperCase()

  return (
    <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-10 flex items-center justify-between sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 5H17M3 10H17M3 15H17" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h2 className="hidden sm:block text-sm font-semibold text-pqf-ink">Console administrativo</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-pqf-ink leading-tight">{userName}</p>
          <p className="text-xs text-pqf-muted">{userEmail}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-pqf-blue-soft text-pqf-blue flex items-center justify-center font-semibold text-sm" aria-hidden="true">
          {inicial}
        </div>
      </div>
    </header>
  )
}
