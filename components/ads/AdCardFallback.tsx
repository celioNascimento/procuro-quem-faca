// components/ads/AdCardFallback.tsx

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
      className={`flex items-center justify-between w-full my-2 bg-gradient-to-r ${fallback.cor} rounded-2xl p-3 md:p-4 text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all gap-2`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/15 rounded-xl flex items-center justify-center text-xl shrink-0">
          {fallback.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[11px] md:text-[13px] uppercase italic tracking-tight leading-snug truncate">
            {fallback.titulo}
          </p>
          <p className="text-white/80 text-[9px] md:text-[10px] font-medium mt-0.5 leading-snug truncate">
            {fallback.subtitulo}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <span className="bg-white/20 border border-white/30 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap">
          {fallback.cta} →
        </span>
      </div>
    </Link>
  )
}
