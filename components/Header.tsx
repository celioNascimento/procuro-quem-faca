//components/Header.tsx

'use client'
import Link from 'next/link'
import BackButton from './BackButton'
import { HeaderAuthButton } from './HeaderAuthButton'

import type { HeaderProps } from './Header.types'
import Logo from './Logo'

export default function Header({ href }: HeaderProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md font-sans border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 h-16 md:h-28 flex items-center justify-between">

        {/* Esquerda — voltar */}
        <div className="w-10 md:w-32 flex justify-start items-center shrink-0">
          <BackButton href={href ?? '/'} />
        </div>

        {/* Centro — logo */}
        <div className="flex-1 flex justify-center items-center px-2">
          <Link href="/" className="transition-all hover:opacity-80 active:scale-95">
            <Logo variant="header" priority />
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
