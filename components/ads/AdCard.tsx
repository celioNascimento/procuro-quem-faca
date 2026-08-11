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

  // 1) Verifica imediatamente se a data de expiração do anúncio já passou
  const expirado = anuncio?.data_expiracao ? new Date(anuncio.data_expiracao) < new Date() : false

  useEffect(() => {
    // Se o anúncio for próprio ou estiver expirado, a verificação de render do Google não é necessária
    if (!anuncio || expirado || anuncio.tipo === 'proprio') return

    if (!anuncio.adsense_slot) {
      setMostrarFallback(true)
      return
    }

    const timer = setTimeout(() => {
      const el = adRef.current
      if (!el || el.offsetHeight <= 10) setMostrarFallback(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [anuncio, expirado])

  // 2) Aciona o fallback se estiver vencido ou não houver anúncio
  if (!anuncio || expirado) {
    return <AdCardFallback fallback={fallback} contexto={contexto} />
  }

  // 3) Renderiza a imagem do Lojista local (se for anúncio 'proprio')
  if (anuncio.tipo === 'proprio' && anuncio.imagem_url) {
    return (
      <a 
        href={anuncio.link_destino || '#'} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block my-2 w-full overflow-hidden rounded-2xl shadow-sm hover:opacity-95 transition-opacity"
      >
        <img src={anuncio.imagem_url} alt={anuncio.titulo} className="w-full h-auto object-cover" />
      </a>
    )
  }

  // 4) Renderiza bloco do Google AdSense
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