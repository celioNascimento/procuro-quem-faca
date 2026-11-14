// components/ads/AdCardFallback.tsx
//
// Divulgação do próprio PQF (para lojistas) quando não há anúncio de cliente na praça.
// Mesmo visual dos cards da lista: fundo branco, cantos de 2rem e letras legíveis (nada abaixo de 14px).
// A cor do campo `cor` de cada fallback (lib/ads/fallbacks.ts) deixou de ser usada aqui.

'use client'
import Link from 'next/link'
import type { AdFallback } from '@/types/ads'

type Props = {
  fallback: AdFallback
  contexto?: string
}

export function AdCardFallback({ fallback, contexto = '' }: Props) {
  return (
    <Link
      href={fallback.href(contexto)}
      className="group block w-full rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] md:px-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-2xl md:size-14"
          >
            {fallback.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Anúncio</p>
            <p className="text-pretty text-base font-bold leading-snug text-slate-900">{fallback.titulo}</p>
            <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-slate-600">{fallback.subtitulo}</p>
          </div>
        </div>
        <span className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-bold text-blue-700 transition-colors group-hover:bg-blue-100 sm:shrink-0">
          {fallback.cta} →
        </span>
      </div>
    </Link>
  )
}
