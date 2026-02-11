'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BackButton from './BackButton'

export default function Header({ href }) {
  const router = useRouter()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100/50">
      <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <div className="w-12">
          {/* LÓGICA DE CORREÇÃO:
              Se houver href, usa o componente padrão (link direto).
              Se NÃO houver, renderiza um botão manual que aciona o histórico do navegador (router.back).
          */}
          {href ? (
            <BackButton href={href} />
          ) : (
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              aria-label="Voltar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-center">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-14 md:h-18 w-auto object-contain" 
            />
          </Link>
        </div>

        <div className="w-12 invisible md:visible"></div>
      </div>
    </nav>
  )
}