'use client'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HeaderCliente({ nomeCliente }) {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)

  const handleLogout = async () => {
    setSaindo(true)
    try {
      // 1. Encerra a sessão no Supabase (invalida token no servidor + limpa localStorage)
      await supabase.auth.signOut()

      // 2. Limpa qualquer chave do Supabase que possa ter ficado no storage
      //    O signOut() já faz isso, mas em casos de erro parcial garantimos manualmente
      if (typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter(k => k.startsWith('sb-'))
          .forEach(k => localStorage.removeItem(k))
        Object.keys(sessionStorage)
          .filter(k => k.startsWith('sb-'))
          .forEach(k => sessionStorage.removeItem(k))
      }

      // 3. window.location.href em vez de router.push —
      //    força reload completo e descarta todo estado React em memória
      //    router.push('/') manteria o componente montado com dados do usuário anterior
      window.location.href = '/'

    } catch (err) {
      console.error('Erro ao sair:', err)
      // Mesmo com erro, redireciona — não deixa o usuário preso
      window.location.href = '/'
    }
  }

  const nome = nomeCliente || ''

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md border-b border-slate-50 sticky top-0 z-50 font-sans">
      <div className="max-w-xl mx-auto px-6 h-20 md:h-24 flex justify-between items-center gap-3">

        {/* ESQUERDA: Voltar */}
        <div className="shrink-0">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl transition-all active:scale-90 hover:bg-white hover:text-blue-600 hover:border-blue-100 hover:shadow-sm"
            title="Voltar"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* CENTRO: Logo */}
        <div className="flex-1 flex justify-center">
          <Link
            href="/"
            className="transition-transform hover:opacity-80 active:scale-95 flex items-center justify-center w-40 md:w-56"
          >
            <Image
              src="/logo.png"
              alt="Logo Procuro Quem Faça"
              width={240}
              height={70}
              className="w-full h-auto object-contain drop-shadow-sm"
              priority
            />
          </Link>
        </div>

        {/* DIREITA: Nome + Logout */}
        <div className="shrink-0 flex items-center gap-2">
          {nome && (
            <div className="hidden md:flex flex-col items-end min-w-0">
              <span className="text-[9px] font-black uppercase text-slate-400 leading-none tracking-widest whitespace-nowrap">
                Painel
              </span>
              <span className="text-[12px] font-black italic uppercase text-slate-900 tracking-tighter text-right break-words max-w-[120px] leading-tight mt-0.5">
                {nome}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={saindo}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm border border-slate-100 active:scale-90 disabled:opacity-50"
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