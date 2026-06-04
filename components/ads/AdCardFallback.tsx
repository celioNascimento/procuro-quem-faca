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
      className={`block w-full my-2 bg-gradient-to-r ${fallback.cor} rounded-[2.5rem] p-5 text-white shadow-xl active:scale-[0.98] transition-all`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl shrink-0">
          {fallback.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[13px] uppercase italic tracking-tight leading-snug">
            {fallback.titulo}
          </p>
          <p className="text-white/70 text-[10px] font-medium mt-0.5 leading-snug">
            {fallback.subtitulo}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <span className="bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
          {fallback.cta} →
        </span>
      </div>
    </Link>
  )
}