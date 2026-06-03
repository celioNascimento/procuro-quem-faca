'use client'
import Link from 'next/link'
import { LogIn, Loader2, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function HeaderAuthButton() {
  const { session, loading, erroLogin, loginGoogle } = useAuth()

  // Ainda carregando
  if (session === undefined) {
    return <div className="w-9 h-9 rounded-full animate-pulse bg-slate-100" />
  }

  // Logado
  if (session) {
    return (
      <Link
        href="/painel/perfil"
        className="flex items-center gap-2 p-1 md:pr-4 rounded-full border border-slate-100 bg-slate-50 hover:bg-blue-50 transition-all group"
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
    )
  }

  // Não logado
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