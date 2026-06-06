import Link from 'next/link'
import { LogOut, ChevronLeft } from 'lucide-react'
import { useLogout } from '@/hooks/useLogout'
import { useRouter } from 'next/navigation'

export default function DashboardHeader() {
  const { logout } = useLogout()
  const router = useRouter()

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md font-sans border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 h-16 md:h-28 flex items-center justify-between">

        {/* Esquerda — voltar */}
        <div className="w-10 md:w-32 shrink-0 flex justify-start items-center">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all active:scale-95"
            title="Voltar"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Centro — logo */}
        <div className="flex-1 flex justify-center items-center px-2">
          <Link href="/" className="transition-all hover:opacity-80 active:scale-95">
            <img
              src="/logo.png"
              alt="Procuro Quem Faça"
              className="h-10 md:h-14 w-auto object-contain drop-shadow-sm"
            />
          </Link>
        </div>

        {/* Direita — logout */}
        <div className="w-10 md:w-32 shrink-0 flex justify-end items-center">
          <button
            onClick={logout}
            className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 shadow-sm"
            title="Encerrar Sessão"
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </nav>
  )
}