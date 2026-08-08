//components/Header.tsx

'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BackButton from './BackButton'
import { HeaderAuthButton } from './HeaderAuthButton'

type Props = {
  href?: string
}

export default function Header({ href }: Props) {
  const router = useRouter()

  return (
    {/* A classe overflow-hidden foi removida daqui para liberar o menu flutuante */}
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md font-sans border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 h-16 md:h-28 flex items-center justify-between">

        {/* Esquerda — voltar */}
        <div className="w-10 md:w-32 flex justify-start items-center shrink-0">
          {href ? (
            <BackButton href={href} />
          ) : (
            <button
              onClick={() => router.back()}
              className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:shadow-sm transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Centro — logo */}
        <div className="flex-1 flex justify-center items-center px-2">
          <Link href="/" className="transition-all hover:opacity-80 active:scale-95">
            <img
              src="/logo.png"
              alt="Procuro Quem Faça"
              className="h-10 md:h-14 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Direita — auth */}
        <div className="w-10 md:w-32 flex justify-end items-center shrink-0">
          <HeaderAuthButton />
        </div>

      </div>
    </nav>
  )
}
