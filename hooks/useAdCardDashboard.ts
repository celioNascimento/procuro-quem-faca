// hooks/useAdCardDashboard.ts
//
// Resolve o anúncio da praça do prestador logado (sessão → prestador →
// cidade/categoria → anúncio ativo) e registra impressão/clique.
// Usado por components/dashboard/AdCardDashboard.tsx.
// undefined = carregando · null = sem anúncio (cai no fallback).

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { buscarPrestadorPorUserId } from '@/lib/services/cadastroPrestador.service'
import {
  listarAnunciosAtivosPorPraca,
  registrarMetricaAnuncio,
  type AnuncioComAnunciante,
} from '@/lib/services/anunciosPublicos.service'

type AnuncioComMetrica = AnuncioComAnunciante & { segmentacao_id_ativa?: string }

export function useAdCardDashboard(posicao: string) {
  const [anuncio, setAnuncio] = useState<AnuncioComAnunciante | null | undefined>(undefined)

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const prestador = await buscarPrestadorPorUserId(userId)
        const cidadeId = prestador?.cidade_id ? String(prestador.cidade_id) : null
        const categoriaId = prestador?.categoria_id ? String(prestador.categoria_id) : null

        if (!cidadeId || !categoriaId) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const anunciosDaPraca = await listarAnunciosAtivosPorPraca(cidadeId, categoriaId, posicao)
        if (!cancelado) setAnuncio(anunciosDaPraca[0] ?? null)
      } catch {
        if (!cancelado) setAnuncio(null)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [posicao])

  // 1 impressão quando o anúncio real é resolvido (dedup de 30min e vigência no servidor).
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
