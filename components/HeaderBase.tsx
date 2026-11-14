//components/HeaderBase.tsx
//
// Casca única dos cabeçalhos do app (Header público e HeaderCliente): mesma altura, mesma sombra,
// logo à esquerda ao lado do botão de voltar e as ações à direita.
//
// ALTURA: h-16 (64px) no celular e md:h-18 (72px) a partir de 768px. As páginas reservam esse espaço
// no topo (pt-*) e os elementos "sticky" usam o mesmo valor (top-16 / md:top-18, ou 72px + folga).
// Se mudar a altura aqui, revise esses valores (ver doc 10, seção "Cabeçalho").

import type { ReactNode } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

type Props = {
  /** Botão de voltar (fica antes da logo). */
  voltar: ReactNode
  /** Ações da direita (conta, sair…). */
  direita?: ReactNode
  /** Alinha com páginas de conteúdo largo (max-w-6xl), como a lista de resultados. */
  larga?: boolean
}

export default function HeaderBase({ voltar, direita, larga = false }: Props) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-[100] border-b border-slate-100 bg-white font-sans shadow-sm shadow-slate-900/5">
      {/* Fio com as cores da marca (azul e amarelo da logo) */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-700 via-blue-500 via-80% to-amber-400" />

      <div className={`mx-auto flex h-16 items-center justify-between gap-3 md:h-18 ${larga ? 'max-w-6xl px-5 md:px-6' : 'max-w-5xl px-4'}`}>
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          {voltar}
          <Link
            href="/"
            aria-label="Procuro Quem Faça — página inicial"
            className="shrink-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-95"
          >
            <Logo variant="header" priority />
          </Link>
        </div>

        {direita && <div className="flex shrink-0 items-center gap-2">{direita}</div>}
      </div>
    </nav>
  )
}
