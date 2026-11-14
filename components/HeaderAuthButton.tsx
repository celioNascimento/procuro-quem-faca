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
    return <div className="size-11 rounded-full animate-pulse bg-slate-100" />
  }

  if (session) {
    // Alinhado com o resolverDestinoPosLogin: se não tem role, tratamos visualmente como cliente
    const safeRole = role || 'cliente'

    const destinoPainel = safeRole === 'prestador' 
      ? (prestadorStatus === 'pendente' ? '/cadastro' : '/dashboard')
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
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-4 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
              {session.user.user_metadata?.avatar_url ? (
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600">
                  <User size={16} />
                </div>
              )}
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
              {labelPainel}
            </span>
          </Link>

          <button
            onClick={() => logout({ origem: 'header_principal', redirectTo: '/' })}
            className="flex size-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-500 active:scale-95"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>

        </div>

        {/* Mobile */}
        <div className="flex md:hidden">
          <button
            onClick={() => setAberto(v => !v)}
            aria-label="Abrir menu da conta"
            aria-expanded={aberto}
            className="size-11 overflow-hidden rounded-full border-2 border-blue-100 shadow-sm transition-all active:scale-95"
          >
            {session.user.user_metadata?.avatar_url ? (
              <img
                src={session.user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600">
                <User size={18} />
              </div>
            )}
          </button>

          {aberto && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                href={destinoPainel}
                onClick={() => setAberto(false)}
                className="flex items-center gap-3 min-h-11 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <IconePainel size={16} />
                {labelPainel}
              </Link>
              <div className="h-px bg-slate-100 mx-3" />
                 <button
                onClick={() => { logout({ origem: 'header_principal', redirectTo: '/' }); setAberto(false) }}
                className="w-full flex items-center gap-3 min-h-11 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} />
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
        <span className="hidden whitespace-nowrap text-xs font-semibold text-red-600 md:block">
          Erro ao entrar
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={() => loginGoogle()}
      disabled={loading}
      aria-label="Entrar"
      className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-70 md:size-auto md:min-h-11 md:gap-2 md:px-5"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogIn size={16} />
      )}
      <span className="hidden whitespace-nowrap text-sm font-semibold md:block">
        {loading ? '...' : 'Entrar'}
      </span>
    </button>
  )
}
