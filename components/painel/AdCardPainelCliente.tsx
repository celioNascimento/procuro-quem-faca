// components/painel/AdCardPainelCliente.tsx
'use client'

import { useAdCardPainelCliente } from '@/hooks/useAdCardPainelCliente'
import { AdCardFallback } from '@/components/ads/AdCardFallback'
import type { AdFallback } from '@/types/ads'
import type { ClienteServico } from '@/types/clienteServicos'

const POSICAO = 'dashboard_cliente'

const FALLBACK_PADRAO: AdFallback = {
  emoji: '🤝',
  titulo: 'Procuro Quem Faça é 100% gratuito pra você',
  subtitulo: 'Sem taxas escondidas — encontre, contrate e avalie seus profissionais de confiança.',
  cta: 'Buscar profissionais',
  cor: 'from-blue-600 to-indigo-600',
  href: () => '/',
}

export function AdCardPainelCliente({
  servicos,
  prestadorId,
  loading = false,
}: {
  servicos: ClienteServico[]
  prestadorId?: string | number | null
  loading?: boolean
}) {
  const { anuncio, handleClick } = useAdCardPainelCliente({ servicos, prestadorId, loading, posicao: POSICAO })

  return (
    // min-h só durante loading para evitar layout shift — depois o
    // conteúdo dita a altura, sem espaço extra abaixo do fallback.
    <div className={`w-full max-w-4xl mx-auto${anuncio === undefined || loading ? ' min-h-[140px]' : ''}`}>
      {anuncio === undefined || loading ? (
        <div className="w-full h-[140px] bg-zinc-50 border border-zinc-100 rounded-2xl" />
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
            src={anuncio.imagem_url ?? ''}
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
