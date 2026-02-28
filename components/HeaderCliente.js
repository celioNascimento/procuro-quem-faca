'use client'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HeaderCliente({ nomeCliente }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md border-b border-slate-50 sticky top-0 z-50 font-sans">
      <div className="max-w-xl mx-auto px-6 h-20 md:h-24 flex justify-between items-center">
        
        {/* LADO ESQUERDO: Simetria garantida com shrink-0 */}
        <div className="w-16 md:w-32 flex justify-start shrink-0">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl transition-all active:scale-90 hover:bg-white hover:text-blue-600 hover:border-blue-100 hover:shadow-sm"
            title="Voltar"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* CENTRO: LOGO - Aumentada para w-44 no mobile e w-64 no desktop */}
        <div className="flex-1 flex justify-center px-2">
          <Link 
            href="/" 
            className="transition-transform hover:opacity-80 active:scale-95 flex items-center justify-center w-44 md:w-64"
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

        {/* LADO DIREITO: Identificação e Logout */}
        <div className="w-16 md:w-32 flex justify-end items-center gap-3 shrink-0">
          {nomeCliente && (
            <div className="hidden md:flex flex-col items-end mr-1">
              <span className="text-[9px] font-black uppercase text-slate-400 leading-none tracking-widest">Painel</span>
              <span className="text-[12px] font-black italic uppercase text-slate-900 tracking-tighter truncate max-w-[90px]">
                {nomeCliente.split(' ')[0]}
              </span>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm border border-slate-100 active:scale-90"
            title="Sair da conta"
          >
            <LogOut size={18} />
          </button>
        </div>
        
      </div>
    </nav>
  )
}