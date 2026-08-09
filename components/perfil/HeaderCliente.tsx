//components/perfil/HeaderCliente.tsx 

'use client'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, ChevronLeft } from 'lucide-react'
import { useHeaderCliente } from '@/hooks/useHeaderCliente'

interface HeaderClienteProps {
  nomeCliente?: string
}

export default function HeaderCliente({ nomeCliente }: HeaderClienteProps) {
  const { saindo, handleLogout, handleBack } = useHeaderCliente()
  const nome = nomeCliente || ''

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md font-sans border-b border-slate-100 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 h-16 md:h-28 flex items-center justify-between">

        {/* Esquerda — voltar */}
        <div className="w-10 md:w-32 flex justify-start items-center shrink-0">
          <button
            onClick={handleBack}
            className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all active:scale-95"
            title="Voltar"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Centro — logo (idêntico ao Header público) */}
        <div className="flex-1 flex justify-center items-center px-2">
          <Link href="/" className="transition-all hover:opacity-80 active:scale-95">
            <Image
              src="/logo.png"
              alt="Procuro Quem Faça"
              width={240}
              height={70}
              className="h-10 md:h-14 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Direita — nome + logout */}
        <div className="w-10 md:w-32 flex justify-end items-center gap-2 shrink-0">
          {nome && (
            <div className="hidden md:flex flex-col items-end min-w-0">
              <span className="text-[9px] font-black uppercase text-slate-400 leading-none tracking-widest whitespace-nowrap">
                Painel
              </span>
              <span className="text-[12px] font-black italic uppercase text-slate-900 tracking-tighter text-right max-w-[100px] leading-tight mt-0.5 truncate">
                {nome}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={saindo}
            className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            title="Sair da conta"
          >
            {saindo
              ? <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
              : <LogOut size={18} />
            }
          </button>
        </div>

      </div>
    </nav>
  )
}