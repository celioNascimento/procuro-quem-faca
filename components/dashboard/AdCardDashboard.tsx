// components/dashboard/AdCardDashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { buscarPrestadorPorUserId } from '@/lib/services/cadastroPrestador.service'
import { listarAnunciosAtivosPorPraca, registrarMetricaAnuncio, type AnuncioComAnunciante } from '@/lib/services/adminAnuncios.service'
import { AdCardFallback } from '@/components/ads/AdCardFallback'
import type { AdFallback } from '@/types/ads'

const POSICAO = 'dashboard_prestador'

const FALLBACK_INCENTIVO_PORTFOLIO: AdFallback = {
  emoji: '📸',
  titulo: 'Seu portfólio é sua melhor propaganda',
  subtitulo: 'Prestadores com projetos publicados recebem mais contato de clientes.',
  cta: 'Adicionar trabalho',
  cor: 'from-blue-600 to-indigo-600',
  href: () => '/dashboard',
}

export function AdCardDashboard() {
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

        const anunciosDaPraca = await listarAnunciosAtivosPorPraca(cidadeId, categoriaId, POSICAO)

        // Log temporário para diagnosticar segmentacao_id_ativa
        console.log('[AdCardDashboard] anuncios resolvidos:', JSON.stringify(
          anunciosDaPraca.map(a => ({ id: a.id, segmentacao_id_ativa: (a as any).segmentacao_id_ativa }))
        ))

        if (!cancelado) setAnuncio(anunciosDaPraca[0] ?? null)
      } catch (err) {
        console.error('[AdCardDashboard] erro ao carregar:', err)
        if (!cancelado) setAnuncio(null)
      }
    }

    carregar()
    return () => { cancelado = true }
  }, [])

  useEffect(() => {
    console.log('[AdCardDashboard] impressao — id:', anuncio?.id, 'seg:', (anuncio as any)?.segmentacao_id_ativa)
    if (!anuncio?.id || !(anuncio as any)?.segmentacao_id_ativa) return
    registrarMetricaAnuncio(anuncio.id, (anuncio as any).segmentacao_id_ativa, 'impressao')
  }, [anuncio])

  function handleClick() {
    if (!anuncio?.id || !(anuncio as any)?.segmentacao_id_ativa) return
    registrarMetricaAnuncio(anuncio.id, (anuncio as any).segmentacao_id_ativa, 'clique')
  }

  if (anuncio === undefined) return null

  if (!anuncio || !anuncio.imagem_url) {
    return (
      <div className="mx-auto mb-6 max-w-4xl">
        <AdCardFallback fallback={FALLBACK_INCENTIVO_PORTFOLIO} />
      </div>
    )
  }

  return (
    <a
      href={anuncio.link_destino || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="relative mx-auto mb-6 block w-full max-w-4xl overflow-hidden rounded-2xl shadow-sm transition-opacity hover:opacity-95"
    >
      <img
        src={anuncio.imagem_url}
        alt={anuncio.titulo}
        className="w-full object-cover object-center h-[120px] md:h-[160px] lg:h-[200px]"
      />
      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <span className="rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
          Publicidade
        </span>
      </div>
    </a>
  )
}
