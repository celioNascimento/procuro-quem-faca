// components/LinkFeed.tsx — atalho para o feed de trabalhos concluídos, no cabeçalho das telas internas.
// No celular só o ícone (o nome fica para leitores de tela); a partir de md, ícone + "Trabalhos".
import Link from 'next/link'
import { Images } from 'lucide-react'

export function LinkFeed() {
  return (
    <Link
      href="/feed"
      aria-label="Ver trabalhos concluídos"
      title="Ver trabalhos concluídos"
      data-testid="link-feed-header"
      className="flex size-11 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:size-auto md:min-h-11 md:gap-2 md:px-4"
    >
      <Images size={16} aria-hidden="true" />
      <span className="hidden whitespace-nowrap text-sm font-semibold md:block">Trabalhos</span>
    </Link>
  )
}
