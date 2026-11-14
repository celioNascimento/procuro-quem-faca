//components/perfil/HeaderCliente.tsx

'use client'
import { LogOut, ChevronLeft } from 'lucide-react'
import { useHeaderCliente } from '@/hooks/useHeaderCliente'
import HeaderBase from '@/components/HeaderBase'

interface HeaderClienteProps {
  nomeCliente?: string
}

export default function HeaderCliente({ nomeCliente }: HeaderClienteProps) {
  const { saindo, handleLogout, handleBack } = useHeaderCliente()
  const nome = nomeCliente || ''

  return (
    <HeaderBase
      voltar={
        <button
          onClick={handleBack}
          aria-label="Voltar"
          className="flex size-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-100 hover:text-blue-600 hover:shadow-sm active:scale-95"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
      }
      direita={
        <>
          {nome && (
            <div className="hidden min-w-0 flex-col items-end md:flex">
              <span className="text-xs text-slate-500">Painel</span>
              <span className="max-w-40 truncate text-sm font-semibold leading-tight text-slate-900">{nome}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={saindo}
            aria-label="Sair da conta"
            title="Sair da conta"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:opacity-50"
          >
            {saindo
              ? <div className="size-4 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
              : <LogOut size={18} />
            }
          </button>
        </>
      }
    />
  )
}
