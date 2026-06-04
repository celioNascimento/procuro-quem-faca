'use client'
import Link from 'next/link'
import { LogIn, Loader2, User, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useLogout'

export function HeaderAuthButton() {
  const { session, loading, erroLogin, loginGoogle } = useAuth()
  const { logout } = useLogout()

  if (session === undefined) {
    return <div className="w-9 h-9 rounded-full animate-pulse bg-slate-100" />
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/perfil"
          className="flex items-center gap-2 p-1 md:pr-4 rounded-full border border-slate-100 bg-slate-50 hover:bg-blue-50 transition-all"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
            {session.user.user_metadata?.avatar_url ? (
              <img
                src={session.user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-white">
                <User size={14} />
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 hidden md:block whitespace-nowrap">
            Minha Conta
          </span>
        </Link>

        <button
          onClick={logout}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95"
          title="Sair"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    )
  }

  if (erroLogin) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
        <AlertCircle size={14} className="text-red-500 shrink-0" />
        <span className="text-[10px] font-bold text-red-500 hidden md:block whitespace-nowrap">
          Erro ao entrar
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={() => loginGoogle()}
      disabled={loading}
      className="flex items-center justify-center md:gap-2 w-9 h-9 md:w-auto md:px-5 md:py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all active:scale-95 disabled:opacity-70"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin text-blue-600" />
      ) : (
        <LogIn size={16} className="text-blue-600 md:text-slate-400" />
      )}
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hidden md:block whitespace-nowrap">
        {loading ? '...' : 'Entrar'}
      </span>
    </button>
  )
}