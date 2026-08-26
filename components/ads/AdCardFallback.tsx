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
      className={`block w-full my-2 bg-gradient-to-r ${fallback.cor} rounded-2xl p-4 text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/15 rounded-xl flex items-center justify-center text-xl shrink-0">
          {fallback.emoji}
        </div>
        <div className="flex-1 min-w-0">
          {/* Textos com wrap natural, mas usando leading-tight para evitar altura excessiva */}
          <p className="font-black text-[12px] md:text-[13px] uppercase italic tracking-tight leading-tight">
            {fallback.titulo}
          </p>
          <p className="text-white/80 text-[10px] md:text-[11px] font-medium mt-0.5 leading-tight line-clamp-2">
            {fallback.subtitulo}
          </p>
          
          {/* Botão reposicionado, mas com margem (mt-2.5) bem menor que a original */}
          <div className="mt-2.5 flex justify-end md:justify-start">
            <span className="bg-white/20 border border-white/30 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full whitespace-nowrap">
              {fallback.cta} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
