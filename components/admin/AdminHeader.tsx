//components/admin/AdminHeader.tsx

'use client'

interface AdminHeaderProps {
  userName: string
  userEmail: string
  onOpenMobileMenu: () => void
}

export function AdminHeader({ userName, userEmail, onOpenMobileMenu }: AdminHeaderProps) {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 bg-slate-100 rounded-xl" onClick={onOpenMobileMenu}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5H17M3 10H17M3 15H17" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="hidden sm:block">
          <h2 className="text-sm font-bold text-slate-800 leading-tight tracking-tight uppercase">Admin Console</h2>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-900 leading-none mb-1 capitalize tracking-tight">{userName}</p>
          <p className="text-[10px] font-semibold text-blue-600/70 lowercase">{userEmail}</p>
        </div>
        <div className="w-10 h-10 lg:w-11 lg:h-11 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-700 text-sm border border-white shadow-sm relative">
          {userName.charAt(0)}
          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
      </div>
    </header>
  )
}