'use client'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HeaderCliente({ nomeCliente }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO DA PASTA PUBLIC */}
        <Link href="/" className="transition-transform active:scale-95">
          <Image 
            src="/logo.png" // Caminho da sua logo em public
            alt="Logo Procuro Quem Faça"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        {/* AÇÕES E IDENTIFICAÇÃO */}
        <div className="flex items-center gap-3">
          {nomeCliente && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black uppercase text-slate-400 leading-none">Cliente</span>
              <span className="text-[12px] font-black italic uppercase text-slate-900 tracking-tighter">{nomeCliente}</span>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm border border-slate-100"
            title="Sair da conta"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}