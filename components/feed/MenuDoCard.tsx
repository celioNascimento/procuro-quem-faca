// components/feed/MenuDoCard.tsx — menu ⋯ do card, como no Instagram: Copiar link e Denunciar.
'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Flag, Link2, MoreHorizontal } from 'lucide-react'

interface Props {
  hrefDenuncia: string
  onCopiarLink: () => void
}

export function MenuDoCard({ hrefDenuncia, onCopiarLink }: Props) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false) }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla) }
  }, [aberto])

  const item = 'flex min-h-11 w-full items-center gap-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'
  return (
    <div className="relative" ref={ref}>
      <button
        type="button" onClick={() => setAberto(v => !v)} aria-label="Mais opções" aria-expanded={aberto} aria-haspopup="true" data-testid="feed-menu"
        className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 active:scale-95"
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
      {aberto && (
        <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl" data-testid="feed-menu-itens">
          <button type="button" className={item} data-testid="feed-menu-copiar" onClick={() => { setAberto(false); onCopiarLink() }}>
            <Link2 size={16} aria-hidden="true" /> Copiar link
          </button>
          <Link href={hrefDenuncia} className={`${item} text-red-600`} data-testid="feed-menu-denunciar" onClick={() => setAberto(false)}>
            <Flag size={16} aria-hidden="true" /> Denunciar
          </Link>
        </div>
      )}
    </div>
  )
}
