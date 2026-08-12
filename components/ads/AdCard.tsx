// components/ads/AdCard.tsx 
'use client'
import { useEffect, useRef, useState } from 'react'
import { AdCardFallback } from './AdCardFallback'
import { useAdContext } from '@/hooks/useAdContext'
import type { AdPage, Anuncio } from '@/types/ads'

type Props = {
  page: AdPage
  anuncio?: Anuncio | null
  categoria?: string
}

export function AdCard({ page, anuncio, categoria }: Props) {
  const adRef = useRef<HTMLDivElement>(null)
  const [mostrarFallback, setMostrarFallback] = useState(false)
  const { fallback, contexto } = useAdContext(page, categoria)

  const agora = new Date()
  const expirado = anuncio?.data_expiracao ? new Date(anuncio.data_expiracao) < agora : false
  const agendado = anuncio?.data_inicio ? new Date(anuncio.data_inicio) > agora : false

  useEffect(() => {
    if (!anuncio || expirado || agendado || anuncio.tipo === 'proprio') return

    if (!anuncio.adsense_slot) {
      setMostrarFallback(true)
      return
    }

    const timer = setTimeout(() => {
      const el = adRef.current
      if (!el || el.offsetHeight <= 10) setMostrarFallback(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [anuncio, expirado, agendado])

  if (!anuncio || expirado || agendado) {
    return <AdCardFallback fallback={fallback} contexto={contexto} />
  }

  if (anuncio.tipo === 'proprio' && anuncio.imagem_url) {
    return (
      <a 
        href={anuncio.link_destino || '#'} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="relative block my-2 w-full overflow-hidden rounded-2xl shadow-sm hover:opacity-95 transition-opacity"
      >
        <img src={anuncio.imagem_url} alt={anuncio.titulo} className="w-full h-auto object-cover" />
        <div className="pointer-events-none absolute right-3 top-3 z-10">
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
            Publicidade
          </span>
        </div>
      </a>
    )
  }

  if (anuncio.adsense_slot && !mostrarFallback) {
    return (
      <div className="my-2 min-h-[100px] w-full" ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={anuncio.adsense_client ?? 'ca-pub-XXXXXXXXXXXXXXXX'}
          data-ad-slot={anuncio.adsense_slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  return <AdCardFallback fallback={fallback} contexto={contexto} />
}
