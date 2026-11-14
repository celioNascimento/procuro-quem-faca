// hooks/useAdCardMetricas.ts
//
// Vigência do anúncio (expirado/agendado) e métricas de anúncios próprios:
// 1 impressão quando o anúncio vigente é exibido e 1 clique por toque.
// Usado por components/ads/AdCard.tsx. Dedup de 30min e validação de
// vigência também acontecem no servidor.

import { useEffect } from 'react'
import { registrarMetricaAnuncio } from '@/lib/services/anunciosPublicos.service'
import type { Anuncio } from '@/types/ads'

export function useAdCardMetricas(anuncio: Anuncio | null | undefined) {
  const agora = new Date()
  const expirado = anuncio?.data_expiracao ? new Date(anuncio.data_expiracao) < agora : false
  const agendado = anuncio?.data_inicio ? new Date(anuncio.data_inicio) > agora : false

  useEffect(() => {
    if (!anuncio || expirado || agendado || anuncio.tipo !== 'proprio' || !anuncio.id) return
    registrarMetricaAnuncio(anuncio.id, anuncio.segmentacao_id_ativa, 'impressao')
  }, [anuncio, expirado, agendado])

  function handleClickAnuncioProprio() {
    if (!anuncio?.id) return
    registrarMetricaAnuncio(anuncio.id, anuncio.segmentacao_id_ativa, 'clique')
  }

  return { expirado, agendado, handleClickAnuncioProprio }
}
