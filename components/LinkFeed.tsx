// components/LinkFeed.tsx — atalho para o feed de trabalhos, no cabeçalho das telas internas.
// Só aparece a partir de md (computador), com ícone + "Feed". No celular o feed fica no menu da conta
// (HeaderAuthButton), para o cabeçalho ter sempre os mesmos botões e nada "pular" de uma tela para outra.
// Na própria página do feed o atalho continua no lugar, marcado como página atual.
import Link from 'next/link'
import { Images } from 'lucide-react'

export function LinkFeed({ ativo = false }: { ativo?: boolean }) {
  return (
    <Link
      href="/feed"
      aria-label="Ver o feed de trabalhos"
      aria-current={ativo ? 'page' : undefined}
      title="Ver o feed de trabalhos"
      data-testid="link-feed-header"
      className={`hidden min-h-11 items-center gap-2 rounded-xl border px-4 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:flex ${ativo ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'}`}
    >
      <Images size={16} aria-hidden="true" />
      <span className="whitespace-nowrap text-sm font-semibold">Feed</span>
    </Link>
  )
}
