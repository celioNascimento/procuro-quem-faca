// components/dashboard/AdCardDashboard.tsx
'use client'

import { useAdCardDashboard } from '@/hooks/useAdCardDashboard'
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
  subtitulo: 'Prestadores com trabalhos registrados recebem mais contato de clientes.',
  cta: 'Adicionar trabalho',
  cor: 'from-blue-600 to-indigo-600',
  href: () => '/dashboard?novo=1',
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
  const { anuncio, handleClick } = useAdCardDashboard(POSICAO)

  // Reserva o espaço enquanto a segmentação é resolvida. Renderizar null aqui
  // fazia o conteúdo subir e depois saltar quando o anúncio chegava.
  if (anuncio === undefined) {
    return <div className="mx-auto mb-2 h-[120px] w-full max-w-4xl animate-pulse rounded-2xl border border-slate-100 bg-slate-50 md:h-[160px] lg:h-[200px]" aria-label="Carregando publicidade" />
  }

  if (!anuncio || !anuncio.imagem_url) {
    return (
      <div className="mx-auto mb-2 max-w-4xl">
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
      className="relative mx-auto mb-2 block w-full max-w-4xl overflow-hidden rounded-2xl shadow-sm transition-opacity hover:opacity-95"
    >
      <img
        src={anuncio.imagem_url}
        alt={anuncio.titulo}
        className="w-full object-cover object-center h-[120px] md:h-[160px] lg:h-[200px]"
      />
      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
          Publicidade
        </span>
      </div>
    </a>
  )
}
