//components/Header.tsx

'use client'
import Link from 'next/link'
import BackButton from './BackButton'
import { HeaderAuthButton } from './HeaderAuthButton'

import type { HeaderProps } from './Header.types'
import Logo from './Logo'

export default function Header({ href, larga = false }: HeaderProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white font-sans border-b border-slate-100">
      <div className={`mx-auto flex h-16 items-center justify-between md:h-28 ${larga ? 'max-w-6xl px-5 md:px-6' : 'max-w-5xl px-4'}`}>

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
