// components/painel/AdCardPainelCliente.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { registrarMetricaAnuncio, type AnuncioComAnunciante } from '@/lib/services/adminAnuncios.service'
import { AdCardFallback } from '@/components/ads/AdCardFallback'
import type { AdFallback } from '@/types/ads'
import type { ClienteServico } from '@/types/clienteServicos'

const POSICAO = 'dashboard_cliente'

const FALLBACK_PADRAO: AdFallback = {
  emoji: '🤝',
  titulo: 'Procuro Quem Faça é 100% gratuito pra você',
  subtitulo: 'Sem taxas escondidas — encontre, contrate e avalie seus profissionais de confiança.',
  cta: 'Ver meus projetos',
  cor: 'from-blue-600 to-indigo-600',
  href: () => '/painel/perfil',
}

export function AdCardPainelCliente({
  servicos,
  loading = false,
}: {
  servicos: ClienteServico[]
  loading?: boolean
}) {
  const [anuncio, setAnuncio] = useState<AnuncioComAnunciante | null | undefined>(undefined)

  useEffect(() => {
    if (loading) return

    let cancelado = false
    setAnuncio(undefined)

    async function carregar() {
      try {
        const servicoRecente = servicos[0]
        const prestadorId = servicoRecente?.prestadores?.id
        if (!prestadorId) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const { data: prestador, error } = await supabase
          .from('prestadores')
          .select('cidade_id')
          .eq('id', prestadorId)
          .maybeSingle()

        if (error) throw error

        const cidadeId = prestador?.cidade_id ? String(prestador.cidade_id) : null

        if (!cidadeId) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const agora = new Date().toISOString()

        const { data: anunciosDaPraca } = await supabase
          .from('anuncios_segmentacoes')
          .select(`
            id,
            anuncios!inner(
              *,
              anunciantes(id, razao_social, whatsapp)
            )
          `)
          .eq('cidade_id', cidadeId)
          .eq('anuncios.status', true)
          .eq('anuncios.status_aprovacao', 'aprovado')
          .eq('anuncios.tipo', 'proprio')
          .eq('anuncios.posicao', POSICAO)
          .or(`data_inicio.is.null,data_inicio.lte.${agora}`, { foreignTable: 'anuncios' })
          .or(`data_expiracao.is.null,data_expiracao.gte.${agora}`, { foreignTable: 'anuncios' })

        if (!cancelado) {
          if (anunciosDaPraca && anunciosDaPraca.length > 0) {
            const anuncioEncontrado = anunciosDaPraca[0].anuncios as any
            // id da linha de anuncios_segmentacoes — necessário para atribuir
            // a métrica à praça correta em registrarMetricaAnuncio.
            anuncioEncontrado.segmentacao_id_ativa = anunciosDaPraca[0].id
            setAnuncio(anuncioEncontrado as AnuncioComAnunciante)
          } else {
            setAnuncio(null)
          }
        }
      } catch {
        if (!cancelado) setAnuncio(null)
      }
    }

    if (servicos.length > 0) {
      carregar()
    } else if (!loading) {
      setAnuncio(null)
    }

    return () => {
      cancelado = true
    }
  }, [servicos, loading])

  useEffect(() => {
    if (!anuncio?.id || !(anuncio as any)?.segmentacao_id_ativa) return
    registrarMetricaAnuncio(anuncio.id, (anuncio as any).segmentacao_id_ativa, 'impressao')
  }, [anuncio])

  function handleClick() {
    if (!anuncio?.id || !(anuncio as any)?.segmentacao_id_ativa) return
    registrarMetricaAnuncio(anuncio.id, (anuncio as any).segmentacao_id_ativa, 'clique')
  }

  return (
    <div className="w-full max-w-4xl mx-auto transition-all">
      {anuncio === undefined || loading ? (
        <div className="w-full h-[90px] md:h-[120px] lg:h-[140px] bg-zinc-50 border border-zinc-100 animate-pulse rounded-2xl" />
      ) : anuncio === null ? (
        <div className="w-full">
          <AdCardFallback fallback={FALLBACK_PADRAO} />
        </div>
      ) : (
        <a
          href={anuncio.link_destino || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="relative block w-full h-[90px] md:h-[120px] lg:h-[140px] overflow-hidden rounded-2xl shadow-sm hover:opacity-95 transition-opacity"
        >
          <img
            src={anuncio.imagem_url}
            alt={anuncio.titulo}
            className="w-full h-full object-cover object-center"
          />
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
              Publicidade
            </span>
          </div>
        </a>
      )}
    </div>
  )
}
