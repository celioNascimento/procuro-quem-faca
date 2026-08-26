// components/dashboard/AdCardDashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { buscarPrestadorPorUserId } from '@/lib/services/cadastroPrestador.service'
import { listarAnunciosAtivosPorPraca, registrarMetricaAnuncio, type AnuncioComAnunciante } from '@/lib/services/adminAnuncios.service'
import { AdCardFallback } from '@/components/ads/AdCardFallback'
import type { AdFallback } from '@/types/ads'

const POSICAO = 'dashboard_prestador'

// Fallback próprio deste banner — não usa useAdContext/resolverSegmento
// (aquele é sobre segmento de categoria de serviço, ex: "Pedreiro"). Aqui,
// na ausência de anúncio vendido pra praça, o espaço vira incentivo pro
// próprio prestador completar/divulgar o portfólio — gera valor mesmo
// quando a vaga comercial ainda não foi vendida.
const FALLBACK_INCENTIVO_PORTFOLIO: AdFallback = {
  emoji: '📸',
  titulo: 'Seu portfólio é sua melhor propaganda',
  subtitulo: 'Prestadores com projetos publicados recebem mais contato de clientes.',
  cta: 'Adicionar trabalho',
  cor: 'from-blue-600 to-indigo-600',
  href: () => '/dashboard',
}

/**
 * Banner de anúncio B2B no topo da dashboard do prestador — público distinto
 * do módulo de anúncios pra lojistas na listagem pública (ver AnunciosTab.tsx,
 * que é sobre o PRESTADOR comprando destaque, não sobre lojista vendendo pra
 * ele). Aqui o lojista (ex: loja de material de construção) compra a vaga
 * única "dashboard_prestador" pra praça (cidade+categoria) do prestador —
 * reusa a mesma infraestrutura de cadastro/inventário do admin, sem UI nova.
 *
 * Resolve o prestador logado via sessão, busca cidade_id/categoria_id do
 * próprio cadastro do prestador (não requer slug/params — funciona em
 * qualquer tela da dashboard) e busca o anúncio ativo daquela praça+posição.
 * Sem prestador resolvido, sem segmentação completa, ou sem anúncio vendido
 * pra essa praça, cai no fallback de incentivo ao portfólio (não no fallback
 * genérico de categoria do resto do site).
 *
 * Não usa <AdCard> (renderiza a imagem/link diretamente — decisão de manter
 * este componente simples e independente), então registra impressão/clique
 * aqui mesmo, via registrarMetricaAnuncio, espelhando o que AdCard.tsx faz
 * para anúncios próprios.
 */
export function AdCardDashboard() {
  const [anuncio, setAnuncio] = useState<AnuncioComAnunciante | null | undefined>(undefined) // undefined = carregando

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
        
        if (!cancelado) setAnuncio(anunciosDaPraca[0] ?? null)
      } catch {
        if (!cancelado) setAnuncio(null)
      }
    }

    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  // Registra 1 impressão assim que o anúncio real é resolvido e renderizado
  // (dedup de 30min e validação de vigência acontecem no servidor).
  useEffect(() => {
    if (!anuncio?.id || !(anuncio as any)?.segmentacao_id_ativa) return
    registrarMetricaAnuncio(anuncio.id, (anuncio as any).segmentacao_id_ativa, 'impressao')
  }, [anuncio])

  function handleClick() {
    if (!anuncio?.id || !(anuncio as any)?.segmentacao_id_ativa) return
    registrarMetricaAnuncio(anuncio.id, (anuncio as any).segmentacao_id_ativa, 'clique')
  }

  // Enquanto resolve (undefined), não renderiza nada — evita "pulo" de
  // layout mostrando o fallback e depois trocando pelo anúncio real.
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