//hooks/useAdContext.ts

import { useState } from 'react'
import { resolverSegmento } from '@/lib/ads/categoria-segmento'
import { getFallbackPorSegmento } from '@/lib/ads/fallbacks'
import type { AdPage, AdFallback } from '@/types/ads'

export function useAdContext(page: AdPage, categoria?: string) {
  const [fallback] = useState<AdFallback>(() => {
    const segmento = resolverSegmento(categoria)
    return getFallbackPorSegmento(segmento)
  })

  return { fallback, contexto: categoria ?? '' }
}