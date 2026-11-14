// hooks/useAdCardPainelCliente.ts
//
// Resolve o anúncio da praça do prestador do cliente e registra
// impressão/clique. Usado por components/painel/AdCardPainelCliente.tsx.
// undefined = carregando · null = sem anúncio (cai no fallback).

import { useEffect, useState } from 'react'
import { registrarMetricaAnuncio } from '@/lib/services/anunciosPublicos.service'
import type { AnuncioComAnunciante } from '@/types/ads'
import {
  buscarAnuncioDaPraca,
  buscarCidadeIdDoPrestador,
  type AnuncioComMetrica,
} from '@/lib/services/adCardPainelCliente.service'
import type { ClienteServico } from '@/types/clienteServicos'

interface Params {
  servicos: ClienteServico[]
  prestadorId?: string | number | null
  loading?: boolean
  posicao: string
}

export function useAdCardPainelCliente({ servicos, prestadorId, loading = false, posicao }: Params) {
  const [anuncio, setAnuncio] = useState<AnuncioComAnunciante | null | undefined>(undefined)

  useEffect(() => {
    if (loading) return

    let cancelado = false

    async function carregar() {
      try {
        const servicoRecente = servicos[0]
        const prestadorIdParaBusca = prestadorId ?? servicoRecente?.prestadores?.id
        if (!prestadorIdParaBusca) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const cidadeId = await buscarCidadeIdDoPrestador(prestadorIdParaBusca)
        if (!cidadeId) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const encontrado = await buscarAnuncioDaPraca(cidadeId, posicao)
        if (!cancelado) setAnuncio(encontrado)
      } catch {
        if (!cancelado) setAnuncio(null)
      }
    }

    if (servicos.length > 0 || prestadorId) {
      carregar()
    } else {
      queueMicrotask(() => setAnuncio(null))
    }

    return () => {
      cancelado = true
    }
  }, [servicos, prestadorId, loading, posicao])

  useEffect(() => {
    const segId = (anuncio as AnuncioComMetrica | null | undefined)?.segmentacao_id_ativa
    if (!anuncio?.id || !segId) return
    registrarMetricaAnuncio(anuncio.id, segId, 'impressao')
  }, [anuncio])

  function handleClick() {
    const segId = (anuncio as AnuncioComMetrica | null | undefined)?.segmentacao_id_ativa
    if (!anuncio?.id || !segId) return
    registrarMetricaAnuncio(anuncio.id, segId, 'clique')
  }

  return { anuncio, handleClick }
}
