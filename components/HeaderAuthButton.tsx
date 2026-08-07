//components/HeaderAuthButton.tsx

'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LogIn, Loader2, User, AlertCircle, LogOut, LayoutDashboard, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useLogout'

export function HeaderAuthButton() {
  const { session, loading, erroLogin, loginGoogle, role, prestadorStatus } = useAuth()
  const { logout } = useLogout()
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  // TRAVA DE SEGURANÇA VISUAL (Corrigida):
  // Apenas trava se a sessão ainda estiver carregando.
  // Se a sessão existe, nós renderizamos a UI, usando fallback se o role for null.
  if (session === undefined) {
    return <div className="w-9 h-9 rounded-full animate-pulse bg-slate-100" />
  }

  if (session) {
    // Alinhado com o resolverDestinoPosLogin: se não tem role, tratamos visualmente como cliente
    const safeRole = role || 'cliente'

    const destinoPainel = safeRole === 'prestador' 
      ? (prestadorStatus === 'pendente' ? '/cadastro' : '/dashboard/perfil')
      : '/painel/perfil'
      
    const labelPainel = safeRole === 'prestador'
      ? (prestadorStatus === 'pendente' ? 'Concluir Cadastro' : 'Meu Painel')
      : 'Minha Conta'
      
    const IconePainel = safeRole === 'prestador'
      ? (prestadorStatus === 'pendente' ? CheckCircle : LayoutDashboard)
      : User

    return (
      <div className="relative" ref={ref}>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href={destinoPainel}
            className="flex items-center gap-2 p-1 pr-4 rounded-full border border-slate-100 bg-slate-50 hover:bg-blue-50 transition-all"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
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
            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 whitespace-nowrap">
              {labelPainel}
            </span>
          </Link>

          <button
            onClick={() => logout()}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden">
          <button
            onClick={() => setAberto(v => !v)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm active:scale-95 transition-all"
          >
            {session.user.user_metadata?.avatar_url ? (
              <img
                src={session.user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                <User size={14} />
              </div>
            )}
          </button>

          {aberto && (
            <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                href={destinoPainel}
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wide hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <IconePainel size={13} />
                {labelPainel}
              </Link>
              <div className="h-px bg-slate-100 mx-3" />
              <button
                onClick={() => { logout(); setAberto(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wide hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut size={13} />
                Sair
              </button>
            </div>
          )}
        </div>

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
