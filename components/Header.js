'use client'
import Link from 'next/link'
import BackButton from './BackButton'

export default function Header({ href = "/" }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100/50">
      <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <div className="w-12">
          <BackButton href={href} />
        </div>

        <div className="flex-1 flex justify-center">
          <Link href="/" className="transition-opacity hover:opacity-80">
            {/* Tamanho reduzido para h-14 no mobile e h-18 no desktop para mais elegância */}
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