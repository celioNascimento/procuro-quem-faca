//components/home/HeaderBotoes.tsx 

'use client'
import Link from 'next/link'
import { LogIn, User, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePathname, useSearchParams } from 'next/navigation'
import { insertLog } from '@/hooks/useLog'

const btnGhost   = 'flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full whitespace-nowrap bg-white/80 backdrop-blur-sm border border-slate-200/70 text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-md hover:bg-white hover:text-slate-700 transition-all duration-200 active:scale-95'
const btnPrimary = 'flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full whitespace-nowrap bg-blue-600 text-white text-[10px] md:text-xs font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-all duration-200 active:scale-95'
const skeleton   = 'h-8 md:h-9 rounded-full animate-pulse bg-slate-100'

export function HeaderBotoes() {
  const { session, role, prestadorStatus, roleLoading, loading, erroLogin, loginGoogle } = useAuth()

  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const queryString = searchParams.toString()
  const origemAtual = queryString ? `${pathname}?${queryString}` : pathname

  const cadastroPendente = role === 'prestador' && prestadorStatus === 'pendente'
  const painelHref = cadastroPendente
    ? '/cadastro'
    : `/dashboard?origem=${encodeURIComponent(origemAtual)}`

  if (session === undefined || roleLoading) {
    return (
      <div className="flex gap-2">
        <div className={`${skeleton} w-28 md:w-36`} />
        <div className={`${skeleton} w-28 md:w-32`} />
      </div>
    )
  }

  if (!session) {
    return (
      <>
        {erroLogin && (
          <span className="text-[9px] font-semibold text-red-400 mr-1 animate-in fade-in">
            Falha. Tente novamente.
          </span>
        )}
        <button
          onClick={() => loginGoogle()}
          disabled={loading}
          className={`${btnGhost} disabled:opacity-40`}
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            : <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
          }
          <span className="hidden sm:inline">{loading ? 'Entrando...' : 'Área do cliente'}</span>
        </button>
        <Link
          href="/login"
          onClick={() => insertLog({ acao: 'CLIQUE_SOU_PROFISSIONAL' })}
          className={btnPrimary}
        >
          <LogIn size={13} />
          <span className="hidden sm:inline">Sou </span>Profissional
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href="/painel/perfil" className={btnGhost}>
        <User size={13} className="text-blue-500 shrink-0" />
        <span className="hidden sm:inline">{role === 'prestador' ? 'Área do Cliente' : 'Minha Área'}</span>
        <span className="sm:hidden">{role === 'prestador' ? 'Cliente' : 'Área'}</span>
      </Link>
      {role === 'prestador' && (
        <Link href={painelHref} className={btnPrimary}>
          <LayoutDashboard size={13} className="shrink-0" />
          <span className="hidden sm:inline">
            {cadastroPendente ? 'Completar Cadastro' : 'Meu Painel'}
          </span>
          <span className="sm:hidden">
            {cadastroPendente ? 'Cadastro' : 'Painel'}
          </span>
        </Link>
      )}
    </>
  )
}